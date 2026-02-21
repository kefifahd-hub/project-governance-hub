/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import ActionTracker from './pages/ActionTracker';
import BudgetDashboard from './pages/BudgetDashboard';
import ChangeManagement from './pages/ChangeManagement';
import ClientBriefing from './pages/ClientBriefing';
import FEEDTracker from './pages/FEEDTracker';
import FinanceModel from './pages/FinanceModel';
import Home from './pages/Home';
import NPVCalculator from './pages/NPVCalculator';
import NewProject from './pages/NewProject';
import ProjectDashboard from './pages/ProjectDashboard';
import QAQCDashboard from './pages/QAQCDashboard';
import Reports from './pages/Reports';
import RiskRegister from './pages/RiskRegister';
import ScheduleMonitoring from './pages/ScheduleMonitoring';
import ScheduleSync from './pages/ScheduleSync';
import Settings from './pages/Settings';
import SiteSelection from './pages/SiteSelection';
import UserAccess from './pages/UserAccess';
import WeeklyReports from './pages/WeeklyReports';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ActionTracker": ActionTracker,
    "BudgetDashboard": BudgetDashboard,
    "ChangeManagement": ChangeManagement,
    "ClientBriefing": ClientBriefing,
    "FEEDTracker": FEEDTracker,
    "FinanceModel": FinanceModel,
    "Home": Home,
    "NPVCalculator": NPVCalculator,
    "NewProject": NewProject,
    "ProjectDashboard": ProjectDashboard,
    "QAQCDashboard": QAQCDashboard,
    "Reports": Reports,
    "RiskRegister": RiskRegister,
    "ScheduleMonitoring": ScheduleMonitoring,
    "ScheduleSync": ScheduleSync,
    "Settings": Settings,
    "SiteSelection": SiteSelection,
    "UserAccess": UserAccess,
    "WeeklyReports": WeeklyReports,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};