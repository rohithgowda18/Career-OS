export interface ChartTheme {
  grid: string;
  text: string;
  colors: string[];
}

export interface ThemePreset {
  id: string;
  name: string;
  pageBg: string;
  card: string;
  cardHeader: string;
  buttonPrimary: string;
  buttonSecondary: string;
  input: string;
  badgeGreen: string;
  badgeOrange: string;
  badgeRed: string;
  textColor: string;
  headingColor: string;
  accentText: string;
  accentBg: string;
  tableHeaderClass: string;
  tableRowClass: string;
  tableCellClass: string;
  sidebarBg: string;
  emptyStateClass: string;
  loadingStateClass: string;
  containerClass: string;
  chartTheme: ChartTheme;
  navActive: string;
  navInactive: string;
  navbarBg: string;
}
