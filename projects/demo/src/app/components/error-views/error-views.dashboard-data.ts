import { DashboardDataDto } from '@dragonworks/ngx-dashboard';
import {
  REVENUE_BREAKDOWN_TYPEID,
  REVENUE_FORECAST_TYPEID,
  SITE_MAP_TYPEID,
} from './demo-widgets';

// A board saved by a session that had every widget type. This session has none
// of them, so all three cells go through UNKNOWN_WIDGET_RESOLVER - each landing
// on a different answer.
export const ERROR_VIEWS_DASHBOARD: DashboardDataDto = {
  version: '1.1.0',
  dashboardId: 'demo-error-views',
  rows: 3,
  columns: 12,
  gutterSize: '0.5em',
  cells: [
    {
      row: 1,
      col: 1,
      rowSpan: 3,
      colSpan: 4,
      widgetTypeid: REVENUE_BREAKDOWN_TYPEID,
      widgetState: {
        currency: 'EUR',
        channels: [
          { label: 'In store', amount: 128400 },
          { label: 'Online', amount: 86200 },
          { label: 'Wholesale', amount: 42700 },
          { label: 'Returns', amount: -8100 },
        ],
      },
    },
    {
      row: 1,
      col: 5,
      rowSpan: 3,
      colSpan: 4,
      widgetTypeid: SITE_MAP_TYPEID,
      widgetState: {
        zones: [
          { label: 'Produce', size: 3 },
          { label: 'Bakery', size: 2 },
          { label: 'Checkout', size: 2 },
          { label: 'Stock', size: 1 },
        ],
      },
    },
    {
      row: 1,
      col: 9,
      rowSpan: 3,
      colSpan: 4,
      widgetTypeid: REVENUE_FORECAST_TYPEID,
      widgetState: { points: [35, 48, 44, 61, 58, 72, 80] },
    },
  ],
};
