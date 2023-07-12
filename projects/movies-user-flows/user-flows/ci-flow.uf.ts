import {UserFlowContext, UserFlowInteractionsFn, UserFlowOptions, UserFlowProvider,} from '@push-based/user-flow';

import {mergeBudgets, MovieDetailPageUFO, MovieListPageUFO, SidebarUFO} from '../src';

const flowOptions: UserFlowOptions = {
  name: 'Basic user flow to ensure basic functionality',
};

const interactions: UserFlowInteractionsFn = async (
  ctx: UserFlowContext
): Promise<any> => {
  const {flow, collectOptions} = ctx;
  const url = `${collectOptions.url}/list/category/popular`;
  const sidebar = new SidebarUFO(ctx);
  const movieListPage = new MovieListPageUFO(ctx);
  const topRatedName = 'topRated';
  const movieDetailPage = new MovieDetailPageUFO(ctx);

  await flow.navigate(url, {
    stepName: '🧭 Initial navigation',
    config: {
      extends: 'lighthouse:default',
      settings: {
        budgets: mergeBudgets([
          './projects/movies-user-flows/budgets/angular.budgets.json',
          './projects/movies-user-flows/budgets/general-timing.budgets.json',
          './projects/movies/testing/movie-list.budgets.json',
        ]),
      },
    },
  });
  await flow.snapshot({
    stepName: '✔ Initial navigation done',
  });
  await flow.startTimespan({
    stepName: '🧭 Navigate to popular',
  });
  await sidebar.clickSideMenuBtn();
  await sidebar.navigateToCategory(topRatedName);
  await movieListPage.awaitLCPContent();
  await flow.endTimespan();
  await flow.snapshot({
    stepName: '✔ Navigation to popular done',
  });
  await flow.startTimespan({
    stepName: '🧭 Navigate to detail page',
  });

  await movieListPage.navigateToDetail();
  await movieDetailPage.awaitAllContent();
  await flow.endTimespan();
  await flow.snapshot({
    stepName: '✔ Navigation to detail done',
  });

  return Promise.resolve();
};

export const userFlowProvider: UserFlowProvider = {
  flowOptions,
  interactions,
};

module.exports = userFlowProvider;
