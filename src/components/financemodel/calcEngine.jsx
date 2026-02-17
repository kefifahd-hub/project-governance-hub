// Finance Model Calculation Engine
// Quarterly granularity: Q4 2025 → Q4 2040 (61 quarters)

export const generateQuarters = () => {
  const quarters = [];
  for (let year = 2025; year <= 2040; year++) {
    const startQ = year === 2025 ? 4 : 1;
    for (let q = startQ; q <= 4; q++) {
      quarters.push(`Q${q} ${year}`);
    }
  }
  return quarters;
};

export const QUARTERS = generateQuarters();
const SOP_QUARTER = 'Q4 2028';
const SOP_INDEX = QUARTERS.indexOf(SOP_QUARTER);
const DEPRECIATION_LIFE_YEARS = 10;

// ─── Cell Production ────────────────────────────────────────────────────────
export function calcCellProduction(cellConfig, revenueMap) {
  return QUARTERS.map((q, qi) => {
    const rv = revenueMap[q] || {};
    const rampPct = (rv.rampPct ?? 0) / 100;
    const yieldPct = (rv.yieldPct ?? cellConfig.initialYield ?? 95) / 100;
    const expectedCellVol = cellConfig.ppm * 60 * (cellConfig.plannedOperatingHoursQtr ?? 1769.25) * ((cellConfig.availability ?? 81) / 100);
    const expectedGwhQtr = (expectedCellVol * (cellConfig.cellEnergyWh ?? 670)) / 1e9;
    const expectedGwhAnnual = expectedGwhQtr * 4;
    const afterYieldGwh = expectedGwhAnnual * yieldPct;
    const productionGwh = qi < SOP_INDEX ? 0 : rampPct * expectedGwhQtr * yieldPct;
    const revenuePrice = rv.sellingPriceEurKwh ?? 0;
    const revenueMEur = productionGwh * 1000 * revenuePrice / 1e6;
    return { quarter: q, productionGwh, revenueMEur, expectedGwhQtr, afterYieldGwh, rampPct, yieldPct };
  });
}

// ─── BOM Cost per GWh ───────────────────────────────────────────────────────
export function calcBOMCost(bomAssumptions, productionData) {
  const escalationPerQtr = (bomAssumptions.priceChangePctPerQtr ?? 0) / 100;
  return productionData.map((pd, qi) => {
    const escalation = Math.pow(1 + escalationPerQtr, qi);
    const totalBom = (bomAssumptions.totalBomEurKwh ?? 0) * escalation;
    const bomCostMEur = pd.productionGwh * 1000 * totalBom / 1e6;
    return { quarter: pd.quarter, totalBomEurKwh: totalBom, bomCostMEur };
  });
}

// ─── Aggregate Multi-Cell ────────────────────────────────────────────────────
export function aggregateCells(cellResults) {
  return QUARTERS.map((q, qi) => ({
    quarter: q,
    totalRevenueMEur: cellResults.reduce((s, c) => s + (c[qi]?.revenueMEur ?? 0), 0),
    totalProductionGwh: cellResults.reduce((s, c) => s + (c[qi]?.productionGwh ?? 0), 0),
  }));
}

// ─── CAPEX & Depreciation ────────────────────────────────────────────────────
export function calcCapexAndDepreciation(capexData) {
  const capexByQtr = {};
  capexData.forEach(item => {
    if (!capexByQtr[item.quarter]) capexByQtr[item.quarter] = 0;
    capexByQtr[item.quarter] += item.amountMEur ?? 0;
  });

  // Buildings + Equipment (Land not depreciated)
  const depreciableByQtr = {};
  capexData.filter(c => c.category !== 'Land').forEach(item => {
    if (!depreciableByQtr[item.quarter]) depreciableByQtr[item.quarter] = 0;
    depreciableByQtr[item.quarter] += item.amountMEur ?? 0;
  });

  // Depreciation starts at SOP (Q4 2028), straight-line 10 years = 40 quarters
  const depreciationPerQtr = [];
  let cumulativeDepreciableCapex = 0;
  let cumulativeCapex = 0;
  let cumulativeDepreciation = 0;

  QUARTERS.forEach((q, qi) => {
    const capexThisQtr = capexByQtr[q] ?? 0;
    const depCapexThisQtr = depreciableByQtr[q] ?? 0;
    cumulativeCapex += capexThisQtr;
    if (qi >= SOP_INDEX) cumulativeDepreciableCapex += depCapexThisQtr;

    // Quarterly depreciation = total depreciable CAPEX / (10 * 4)
    const quarterlyDepreciation = qi >= SOP_INDEX ? cumulativeDepreciableCapex / (DEPRECIATION_LIFE_YEARS * 4) : 0;
    cumulativeDepreciation += quarterlyDepreciation;

    depreciationPerQtr.push({
      quarter: q,
      capexMEur: capexThisQtr,
      cumulativeCapex,
      depreciationMEur: quarterlyDepreciation,
      ppAndE: cumulativeCapex - cumulativeDepreciation,
    });
  });
  return depreciationPerQtr;
}

// ─── Labour Cost ─────────────────────────────────────────────────────────────
export function calcLabourCost(headcountPlan) {
  const byQtr = {};
  headcountPlan.forEach(h => {
    if (!byQtr[h.quarter]) byQtr[h.quarter] = 0;
    const yearsFromStart = Math.max(0, QUARTERS.indexOf(h.quarter)) / 4;
    const inflation = Math.pow(1 + (h.annualWageInflationPct ?? 2.5) / 100, yearsFromStart);
    const baseSalary = (h.baseSalaryEurPa ?? 0) * inflation;
    const withShift = baseSalary * (1 + (h.shiftAllowancePct ?? 0) / 100);
    const withSocial = withShift * (1 + (h.socialPensionPct ?? 23.6) / 100);
    byQtr[h.quarter] += ((h.headcountFte ?? 0) * withSocial) / 4 / 1e6; // €M per quarter
  });
  return QUARTERS.map(q => ({ quarter: q, labourCostMEur: byQtr[q] ?? 0 }));
}

// ─── Utility Cost ────────────────────────────────────────────────────────────
export function calcUtilityCost(utilAssumptions, productionByQtr) {
  const u = utilAssumptions;
  return productionByQtr.map(p => {
    const gwh = p.totalProductionGwh;
    const electricity = gwh * (u.electricityGwhPerGwh ?? 18) * 1000 * (u.electricityCostEurMwh ?? 111.2) / 1e6;
    const gas = gwh * (u.gasGwhPerGwh ?? 15) * 1000 * (u.gasCostEurMwh ?? 55) / 1e6;
    const water = gwh * (u.waterM3PerGwh ?? 200) * (u.waterCostEurM3 ?? 1.15) / 1e6 + (u.waterFixedFeeEurMonth ?? 500) * 3 / 1e6;
    const wastewater = gwh * (u.wastewaterM3PerGwh ?? 170) * (u.wastewaterCostEurM3 ?? 1.35) / 1e6;
    return { quarter: p.quarter, utilityCostMEur: electricity + gas + water + wastewater };
  });
}

// ─── Overhead Cost ───────────────────────────────────────────────────────────
export function calcOverheadCost(overheads, productionByQtr, revenueByQtr) {
  return QUARTERS.map((q, qi) => {
    const gwh = productionByQtr[qi]?.totalProductionGwh ?? 0;
    const rev = revenueByQtr[qi]?.totalRevenueMEur ?? 0;
    let operational = 0, gna = 0, launch = 0;
    overheads.forEach(oh => {
      let cost = 0;
      if (oh.costBasis === 'Per Quarter (fixed)') cost = (oh.amount ?? 0) / 1e6;
      else if (oh.costBasis === 'Per GWh (variable)') cost = gwh * (oh.amount ?? 0);
      else if (oh.costBasis === '% Revenue') cost = rev * (oh.amount ?? 0) / 100;
      if (oh.category === 'Operational') operational += cost;
      else if (oh.category === 'G&A') gna += cost;
      else if (oh.category === 'Launch') launch += qi < SOP_INDEX ? cost : 0;
    });
    return { quarter: q, operationalMEur: operational, gnaMEur: gna, launchMEur: launch };
  });
}

// ─── Other OPEX ─────────────────────────────────────────────────────────────
export function calcOtherOpex(otherOpex, revenueByQtr) {
  const o = otherOpex ?? {};
  return revenueByQtr.map(r => {
    const rev = r.totalRevenueMEur ?? 0;
    return {
      quarter: r.quarter,
      outboundMEur: rev * (o.outboundLogisticsPctRevenue ?? 1) / 100,
      royaltyMEur: rev * (o.royaltyPctRevenue ?? 3) / 100,
      warrantyMEur: rev * (o.warrantyPctRevenue ?? 2) / 100,
      rdMEur: rev * (o.rdPctRevenue ?? 0) / 100,
    };
  });
}

// ─── Grant Amortization ──────────────────────────────────────────────────────
export function calcGrantAmortization(grants) {
  const amortByQtr = {};
  QUARTERS.forEach(q => amortByQtr[q] = 0);
  grants.forEach(g => {
    const startIdx = QUARTERS.indexOf(g.amortizationStartQuarter);
    const totalQtrs = (g.amortizationYears ?? 10) * 4;
    const perQtr = (g.cashReceiptMEur ?? 0) / totalQtrs;
    for (let i = startIdx; i < Math.min(startIdx + totalQtrs, QUARTERS.length); i++) {
      if (i >= 0) amortByQtr[QUARTERS[i]] += perQtr;
    }
  });
  return QUARTERS.map(q => ({ quarter: q, grantAmortMEur: amortByQtr[q] }));
}

// ─── Finance Costs ───────────────────────────────────────────────────────────
export function calcFinanceCosts(financingAssumptions, productionByQtr, revenueByQtr) {
  const fa = financingAssumptions ?? {};
  const ltTotal = fa.ltDebtTotalMEur ?? 150;
  const ltRate = (fa.ltInterestRatePct ?? 8) / 100 / 4; // quarterly
  const drawdownQtrs = fa.ltDrawdownPeriodQtrs ?? 15;
  const repayQtrs = fa.ltRepaymentPeriodQtrs ?? 24;
  const wcRate = (fa.wcInterestRatePct ?? 8) / 100 / 4;

  let ltBalance = 0;
  return QUARTERS.map((q, qi) => {
    if (qi < drawdownQtrs) ltBalance += ltTotal / drawdownQtrs;
    if (qi >= drawdownQtrs && qi < drawdownQtrs + repayQtrs) ltBalance -= ltTotal / repayQtrs;
    ltBalance = Math.max(0, ltBalance);
    const ltInterest = ltBalance * ltRate;
    // Working capital: approximate as 2 months of revenue
    const wcBalance = (revenueByQtr[qi]?.totalRevenueMEur ?? 0) * (2 / 3);
    const wcInterest = wcBalance * wcRate;
    return { quarter: q, ltInterestMEur: ltInterest, wcInterestMEur: wcInterest, totalFinanceCostMEur: ltInterest + wcInterest };
  });
}

// ─── Full P&L ────────────────────────────────────────────────────────────────
export function calcPL(inputs) {
  const { cellProduction, bomCosts, labourCosts, utilityCosts, overheadCosts, otherOpex, capexData, grantAmort, financeCosts, taxAssumptions, productionByQtr, revenueByQtr } = inputs;

  const taxRate = (taxAssumptions?.corporateTaxRatePct ?? 25) / 100;
  const lossCarryForward = taxAssumptions?.lossCarryForward ?? true;
  let cumulativeLoss = 0;

  return QUARTERS.map((q, qi) => {
    const rev = revenueByQtr[qi]?.totalRevenueMEur ?? 0;
    const bom = bomCosts.reduce((s, c) => s + (c[qi]?.bomCostMEur ?? 0), 0);
    const labour = labourCosts[qi]?.labourCostMEur ?? 0;
    const utilities = utilityCosts[qi]?.utilityCostMEur ?? 0;
    const opOverhead = overheadCosts[qi]?.operationalMEur ?? 0;
    const depreciation = capexData[qi]?.depreciationMEur ?? 0;
    const outbound = otherOpex[qi]?.outboundMEur ?? 0;
    const cogs = bom + labour + utilities + opOverhead + depreciation + outbound;
    const grossProfit = rev - cogs;
    const gnaLabour = 0; // From headcount G&A
    const gnaOverhead = overheadCosts[qi]?.gnaMEur ?? 0;
    const launch = overheadCosts[qi]?.launchMEur ?? 0;
    const royalty = otherOpex[qi]?.royaltyMEur ?? 0;
    const warranty = otherOpex[qi]?.warrantyMEur ?? 0;
    const rd = otherOpex[qi]?.rdMEur ?? 0;
    const sga = gnaLabour + gnaOverhead + launch + royalty + warranty + rd;
    const grantIncome = grantAmort[qi]?.grantAmortMEur ?? 0;
    const ebit = grossProfit - sga + grantIncome;
    const financeCost = financeCosts[qi]?.totalFinanceCostMEur ?? 0;
    const pbt = ebit - financeCost;

    let tax = 0;
    if (lossCarryForward) {
      if (pbt < 0) { cumulativeLoss += Math.abs(pbt); tax = 0; }
      else {
        const taxableIncome = Math.max(0, pbt - cumulativeLoss);
        cumulativeLoss = Math.max(0, cumulativeLoss - pbt);
        tax = taxableIncome * taxRate;
      }
    } else { tax = Math.max(0, pbt * taxRate); }

    const netProfit = pbt - tax;
    const ebitda = ebit + depreciation;
    return {
      quarter: q, rev, cogs, grossProfit, grossProfitPct: rev > 0 ? grossProfit / rev * 100 : 0,
      sga, ebit, ebitda, ebitdaPct: rev > 0 ? ebitda / rev * 100 : 0,
      financeCost, pbt, tax, netProfit, netProfitPct: rev > 0 ? netProfit / rev * 100 : 0,
      depreciation, grantIncome, bom, labour, utilities, opOverhead, outbound, royalty, warranty
    };
  });
}

// ─── Cash Flow ───────────────────────────────────────────────────────────────
export function calcCashFlow(plData, capexData, financingData, grants, wcAssumptions) {
  const arDays = wcAssumptions?.arPaymentTermsDays ?? 30;
  const apDays = wcAssumptions?.apPaymentTermsDays ?? 45;
  const invDays = wcAssumptions?.inventoryDays ?? 69;
  let prevAR = 0, prevAP = 0, prevInventory = 0;
  let cashBalance = 0;

  const fa = financingData ?? {};
  const ltTotal = fa.ltDebtTotalMEur ?? 150;
  const drawdownQtrs = fa.ltDrawdownPeriodQtrs ?? 15;
  const repayQtrs = fa.ltRepaymentPeriodQtrs ?? 24;

  let equityInjections = [];
  try { equityInjections = JSON.parse(fa.equityInjections || '[]'); } catch {}

  const grantCashByQtr = {};
  grants.forEach(g => { grantCashByQtr[g.receiptQuarter] = (grantCashByQtr[g.receiptQuarter] || 0) + (g.cashReceiptMEur ?? 0); });

  return QUARTERS.map((q, qi) => {
    const pl = plData[qi];
    const capex = capexData[qi]?.capexMEur ?? 0;
    const ar = pl.rev * (arDays / 90);
    const ap = pl.cogs * (apDays / 90);
    const inventory = pl.bom * (invDays / 90);
    const wcChange = (ar - ap + inventory) - (prevAR - prevAP + prevInventory);
    prevAR = ar; prevAP = ap; prevInventory = inventory;

    const cfo = pl.netProfit + pl.depreciation + pl.financeCost - wcChange - pl.grantIncome;
    const grantCash = grantCashByQtr[q] ?? 0;
    const cfi = -capex + grantCash;
    const ltDrawdown = qi < drawdownQtrs ? ltTotal / drawdownQtrs : 0;
    const ltRepayment = (qi >= drawdownQtrs && qi < drawdownQtrs + repayQtrs) ? ltTotal / repayQtrs : 0;
    const equity = equityInjections.find(e => e.quarter === q)?.amount ?? 0;
    const cff = equity + ltDrawdown - ltRepayment - pl.financeCost;
    const netCashChange = cfo + cfi + cff;
    cashBalance += netCashChange;

    return { quarter: q, cfo, cfi, cff, netCashChange, cashBalance, freeCashFlow: cfo + cfi, ltDrawdown, ltRepayment, equity };
  });
}

// ─── Balance Sheet ───────────────────────────────────────────────────────────
export function calcBalanceSheet(plData, cashFlowData, capexData, financingData, grants) {
  const fa = financingData ?? {};
  const ltTotal = fa.ltDebtTotalMEur ?? 150;
  const drawdownQtrs = fa.ltDrawdownPeriodQtrs ?? 15;
  const repayQtrs = fa.ltRepaymentPeriodQtrs ?? 24;

  let retainedEarnings = 0;
  let shareCapital = 0;

  // Grant deferred income
  const grantCashByQtr = {};
  const grantAmortByQtr = {};
  grants.forEach(g => { grantCashByQtr[g.receiptQuarter] = (grantCashByQtr[g.receiptQuarter] || 0) + (g.cashReceiptMEur ?? 0); });
  let cumulativeGrantCash = 0, cumulativeGrantAmort = 0;

  return QUARTERS.map((q, qi) => {
    const pl = plData[qi];
    const cf = cashFlowData[qi];
    retainedEarnings += pl.netProfit;
    shareCapital += cf.equity;
    cumulativeGrantCash += grantCashByQtr[q] ?? 0;
    cumulativeGrantAmort += pl.grantIncome;
    const deferredIncome = Math.max(0, cumulativeGrantCash - cumulativeGrantAmort);

    let ltBalance = 0;
    for (let i = 0; i <= qi && i < drawdownQtrs; i++) ltBalance += ltTotal / drawdownQtrs;
    for (let i = drawdownQtrs; i <= qi && i < drawdownQtrs + repayQtrs; i++) ltBalance -= ltTotal / repayQtrs;
    ltBalance = Math.max(0, ltBalance);
    const stLoans = Math.min(ltBalance, ltTotal / repayQtrs * 4); // next 4 quarters
    const ltLoans = Math.max(0, ltBalance - stLoans);

    const cash = cf.cashBalance;
    const ar = pl.rev * ((fa.arPaymentTermsDays ?? 30) / 90);
    const inventory = pl.bom * ((fa.inventoryDays ?? 69) / 90);
    const ppAndE = capexData[qi]?.ppAndE ?? 0;
    const totalAssets = cash + ar + inventory + ppAndE;
    const ap = pl.cogs * ((fa.apPaymentTermsDays ?? 45) / 90);
    const totalLiabilities = ap + stLoans + ltLoans + deferredIncome;
    const totalEquity = shareCapital + retainedEarnings;
    const check = totalAssets - totalLiabilities - totalEquity;

    return { quarter: q, cash, ar, inventory, ppAndE, totalAssets, ap, stLoans, ltLoans, deferredIncome, totalLiabilities, shareCapital, retainedEarnings, totalEquity, totalLiabilitiesAndEquity: totalLiabilities + totalEquity, balanceCheck: check };
  });
}

// ─── DCF Valuation ───────────────────────────────────────────────────────────
export function calcDCF(cashFlowData, dcfAssumptions) {
  const d = dcfAssumptions ?? {};
  const discountRate = (d.discountRatePct ?? 18) / 100;
  const terminalGrowth = (d.terminalGrowthRatePct ?? 1.5) / 100;
  const valuationYear = d.valuationYear ?? 2026;

  // Aggregate quarterly FCF to annual
  const annualFCF = {};
  cashFlowData.forEach(cf => {
    const year = parseInt(cf.quarter.split(' ')[1]);
    if (!annualFCF[year]) annualFCF[year] = 0;
    annualFCF[year] += cf.freeCashFlow;
  });

  let npvOfCashFlows = 0;
  const years = Object.keys(annualFCF).map(Number).sort();
  const annualRows = years.map(year => {
    const fcf = annualFCF[year];
    const yearOffset = year - valuationYear;
    const discountFactor = yearOffset >= 0 ? Math.pow(1 + discountRate, yearOffset) : 1;
    const discountedFCF = yearOffset >= 0 ? fcf / discountFactor : 0;
    npvOfCashFlows += discountedFCF;
    return { year, fcf, discountedFCF };
  });

  const finalYearFCF = annualFCF[2040] ?? 0;
  const finalYearOffset = 2040 - valuationYear;
  const terminalValue = finalYearOffset >= 0 ? (finalYearFCF * (1 + terminalGrowth)) / (discountRate - terminalGrowth) : 0;
  const npvTerminalValue = terminalValue / Math.pow(1 + discountRate, finalYearOffset);
  const totalNPV = npvOfCashFlows + npvTerminalValue;

  return { annualRows, npvOfCashFlows, terminalValue, npvTerminalValue, totalNPV };
}