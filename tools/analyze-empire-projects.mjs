import { BUSINESSES, FACTORIES } from "../shared/empire.js";
import { EMPIRE_PROJECTS } from "../shared/empireProjects.js";

const topBusinesses = BUSINESSES.reduce((sum, item) => sum + item.incomePerHour, 0);
const entryBusinesses = BUSINESSES.filter((item) => item.respect <= 18).reduce((sum, item) => sum + item.incomePerHour, 0);
const routes = EMPIRE_PROJECTS.slice(0, 3).map((project) => ({
  id: project.id, funding: project.funding,
  hoursAtEntryPortfolio: Number((project.funding / entryBusinesses).toFixed(1)),
  hoursAtFullPortfolio: Number((project.funding / topBusinesses).toFixed(1)),
  cheapestFinale: Math.min(...project.choices.map((choice) => Number(choice.cashCost || choice.bankCost || 0))),
}));
const capstone = EMPIRE_PROJECTS.at(-1);
console.log(JSON.stringify({ businessIncomePerHour: { entryPortfolio: entryBusinesses, fullPortfolio: topBusinesses }, factoryAcquisition: { firstTwo: FACTORIES[0].cost + FACTORIES[1].cost, firstThree: FACTORIES.slice(0, 3).reduce((sum, item) => sum + item.cost, 0) }, routes, capstone: { funding: capstone.funding, cheapestFinale: Math.min(...capstone.choices.map((choice) => Number(choice.cashCost || choice.bankCost || 0))), totalCashFloorAfterTwoRoutes: routes[0].funding + routes[0].cheapestFinale + routes[1].funding + routes[1].cheapestFinale + capstone.funding + Math.min(...capstone.choices.map((choice) => Number(choice.cashCost || choice.bankCost || 0))) } }, null, 2));
