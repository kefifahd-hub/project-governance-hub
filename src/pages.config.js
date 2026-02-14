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
import FEEDTracker from './pages/FEEDTracker';
import Home from './pages/Home';
import NPVCalculator from './pages/NPVCalculator';
import NewProject from './pages/NewProject';
import ProjectDashboard from './pages/ProjectDashboard';
import RiskRegister from './pages/RiskRegister';
import BudgetDashboard from './pages/BudgetDashboard';
import WeeklyReports from './pages/WeeklyReports';
import ClientBriefing from './pages/ClientBriefing';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "FEEDTracker": FEEDTracker,
    "Home": Home,
    "NPVCalculator": NPVCalculator,
    "NewProject": NewProject,
    "ProjectDashboard": ProjectDashboard,
    "RiskRegister": RiskRegister,
    "BudgetDashboard": BudgetDashboard,
    "WeeklyReports": WeeklyReports,
    "ClientBriefing": ClientBriefing,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};