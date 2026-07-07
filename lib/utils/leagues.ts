export type LeagueId =
  | "premier-league"
  | "la-liga"
  | "serie-a"
  | "bundesliga"
  | "ligue-1"
  | "champions-league"
  | "world-cup-2026";

export interface League {
  id: LeagueId;
  name: string;
  teams: string[];
}

export const LEAGUES: League[] = [
  {
    id: "premier-league",
    name: "Ngoại Hạng Anh",
    teams: [
      "Manchester City",
      "Arsenal",
      "Liverpool",
      "Manchester United",
      "Chelsea",
      "Tottenham Hotspur",
      "Newcastle United",
      "Aston Villa",
      "Brighton & Hove Albion",
      "West Ham United",
      "Crystal Palace",
      "Everton",
      "Fulham",
      "Wolverhampton Wanderers",
      "Bournemouth",
      "Brentford",
      "Nottingham Forest",
      "Leicester City",
    ],
  },
  {
    id: "la-liga",
    name: "La Liga (Tây Ban Nha)",
    teams: [
      "Real Madrid",
      "Barcelona",
      "Atletico Madrid",
      "Girona",
      "Real Sociedad",
      "Real Betis",
      "Villarreal",
      "Athletic Bilbao",
      "Valencia",
      "Sevilla",
      "Celta Vigo",
      "Osasuna",
      "Getafe",
      "Rayo Vallecano",
    ],
  },
  {
    id: "serie-a",
    name: "Serie A (Ý)",
    teams: [
      "Inter Milan",
      "AC Milan",
      "Juventus",
      "Napoli",
      "AS Roma",
      "Atalanta",
      "Lazio",
      "Fiorentina",
      "Bologna",
      "Torino",
    ],
  },
  {
    id: "bundesliga",
    name: "Bundesliga (Đức)",
    teams: [
      "Bayern Munich",
      "Borussia Dortmund",
      "RB Leipzig",
      "Bayer Leverkusen",
      "Union Berlin",
      "Eintracht Frankfurt",
      "Wolfsburg",
      "Freiburg",
      "Borussia Monchengladbach",
    ],
  },
  {
    id: "ligue-1",
    name: "Ligue 1 (Pháp)",
    teams: [
      "Paris Saint-Germain",
      "Marseille",
      "Monaco",
      "Lille",
      "Lyon",
      "Lens",
      "Rennes",
      "Nice",
    ],
  },
  {
    id: "champions-league",
    name: "UEFA Champions League",
    teams: [
      "Manchester City",
      "Real Madrid",
      "Bayern Munich",
      "Paris Saint-Germain",
      "Liverpool",
      "Arsenal",
      "Barcelona",
      "Inter Milan",
      "Borussia Dortmund",
      "Atletico Madrid",
      "Chelsea",
      "Juventus",
      "Napoli",
      "Atalanta",
      "Bayer Leverkusen",
      "Benfica",
      "Porto",
      "Ajax",
    ],
  },
  {
    id: "world-cup-2026",
    name: "FIFA World Cup 2026",
    teams: [
      "United States",
      "Canada",
      "Mexico",
      "Argentina",
      "Brazil",
      "France",
      "England",
      "Spain",
      "Germany",
      "Portugal",
      "Netherlands",
      "Belgium",
      "Italy",
      "Croatia",
      "Uruguay",
      "Colombia",
      "Japan",
      "South Korea",
      "Morocco",
      "Senegal",
      "Switzerland",
      "Denmark",
      "Ecuador",
      "Australia",
    ],
  },
];

export function getLeagueById(id: string): League | undefined {
  return LEAGUES.find((l) => l.id === id);
}

export function slugifyTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
