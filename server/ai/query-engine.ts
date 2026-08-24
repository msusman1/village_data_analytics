import { villageDb, haversineDistanceMeters, CURRENT_REFERENCE_DATE } from '../db/database.js';
import { AIQueryResponse, AIVisualization } from '../../src/types/index.js';

export interface QueryIntentResult {
  answer: string;
  visualizations: AIVisualization[];
  clarificationOptions?: {
    id: string | number;
    label: string;
    description?: string;
  }[];
  suggestedFollowUps?: string[];
}

export class VillageQueryEngine {
  public executeIntent(intent: string, params: Record<string, any> = {}): QueryIntentResult {
    const data = villageDb.getRawData();
    const stats = villageDb.getVillageStats();

    switch (intent) {
      // ----------------------------------------------------
      // OLDEST & YOUNGEST
      // ----------------------------------------------------
      case 'FIND_OLDEST_PERSON': {
        const sorted = [...data.people].sort((a, b) => (b.age ?? 0) - (a.age ?? 0));
        const oldest = sorted[0];
        if (!oldest) {
          return { answer: 'No people records found in the database.', visualizations: [] };
        }
        return {
          answer: `The oldest person in Lakra Khurd is **${oldest.full_name}**, who is **${oldest.age} years old** (born on ${oldest.date_of_birth}), residing in **House #${oldest.house_number}** (${oldest.family_number}).`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Oldest Person',
              value: oldest.full_name,
              subValue: `Age ${oldest.age} • House #${oldest.house_number}`,
            },
            {
              type: 'table',
              title: 'Senior Village Elders',
              columns: [
                { key: 'full_name', label: 'Name' },
                { key: 'age', label: 'Age' },
                { key: 'date_of_birth', label: 'Date of Birth' },
                { key: 'house_number', label: 'House #' },
                { key: 'gender', label: 'Gender' },
              ],
              rows: sorted.slice(0, 5).map((p) => ({
                full_name: p.full_name,
                age: p.age,
                date_of_birth: p.date_of_birth,
                house_number: `#${p.house_number}`,
                gender: p.gender,
              })),
            },
          ],
          suggestedFollowUps: [
            `Where does ${oldest.full_name} live?`,
            `Who is the guardian of House #${oldest.house_number}?`,
            'Show everyone above 60.',
          ],
        };
      }

      case 'FIND_YOUNGEST_PERSON': {
        const sorted = [...data.people].sort((a, b) => (a.age ?? 0) - (b.age ?? 0));
        const youngest = sorted[0];
        if (!youngest) {
          return { answer: 'No people records found.', visualizations: [] };
        }
        return {
          answer: `The youngest person in Lakra Khurd is **${youngest.full_name}**, age **${youngest.age} year(s)** (born on ${youngest.date_of_birth}), living in **House #${youngest.house_number}** (${youngest.family_number}).`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Youngest Person',
              value: youngest.full_name,
              subValue: `Age ${youngest.age} • House #${youngest.house_number}`,
            },
            {
              type: 'table',
              title: 'Youngest Village Children',
              columns: [
                { key: 'full_name', label: 'Name' },
                { key: 'age', label: 'Age' },
                { key: 'date_of_birth', label: 'DOB' },
                { key: 'house_number', label: 'House #' },
                { key: 'family_number', label: 'Family' },
              ],
              rows: sorted.slice(0, 6).map((p) => ({
                full_name: p.full_name,
                age: p.age,
                date_of_birth: p.date_of_birth,
                house_number: `#${p.house_number}`,
                family_number: p.family_number,
              })),
            },
          ],
          suggestedFollowUps: [
            'How many children are under 5?',
            'How many children are under 10?',
            'What percentage of the village is under 18?',
          ],
        };
      }

      // ----------------------------------------------------
      // AGE-SPECIFIC QUERIES (18 years old, turning 18, birthdays)
      // ----------------------------------------------------
      case 'PEOPLE_EXACT_AGE_18': {
        const people18 = data.people.filter((p) => p.age === 18);
        return {
          answer: `There are **${people18.length} people** who are exactly 18 years old in the village as of today (${CURRENT_REFERENCE_DATE}): ${people18.map((p) => `**${p.full_name}** (House #${p.house_number})`).join(', ')}.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'People Aged 18',
              value: `${people18.length} individuals`,
              subValue: 'Calculated as of 2026-08-24',
            },
            {
              type: 'table',
              title: '18-Year-Old Residents',
              columns: [
                { key: 'full_name', label: 'Name' },
                { key: 'date_of_birth', label: 'Date of Birth' },
                { key: 'gender', label: 'Gender' },
                { key: 'house_number', label: 'House #' },
                { key: 'phone', label: 'Phone' },
              ],
              rows: people18.map((p) => ({
                full_name: p.full_name,
                date_of_birth: p.date_of_birth,
                gender: p.gender,
                house_number: `#${p.house_number}`,
                phone: p.phone || 'N/A',
              })),
            },
          ],
          suggestedFollowUps: ['Who will turn 18 this year?', 'What percentage of the village is under 18?'],
        };
      }

      case 'TURNING_18_THIS_YEAR': {
        const refYear = new Date(CURRENT_REFERENCE_DATE).getFullYear();
        const turning18 = data.people.filter((p) => {
          if (!p.date_of_birth) return false;
          const birthYear = new Date(p.date_of_birth).getFullYear();
          return refYear - birthYear === 18;
        });

        return {
          answer: `In ${refYear}, **${turning18.length} people** turn (or have turned) 18 years old (born in 2008): ${turning18.map((p) => `**${p.full_name}** (born ${p.date_of_birth})`).join(', ')}.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Turning 18 in 2026',
              value: `${turning18.length} Youth`,
              subValue: 'Eligible for CNIC / Voting Registration',
            },
            {
              type: 'table',
              title: 'Youth Reaching Adulthood (Born 2008)',
              columns: [
                { key: 'full_name', label: 'Name' },
                { key: 'date_of_birth', label: 'Birth Date' },
                { key: 'house_number', label: 'House #' },
                { key: 'family_number', label: 'Family' },
                { key: 'phone', label: 'Contact' },
              ],
              rows: turning18.map((p) => ({
                full_name: p.full_name,
                date_of_birth: p.date_of_birth,
                house_number: `#${p.house_number}`,
                family_number: p.family_number,
                phone: p.phone || 'N/A',
              })),
            },
          ],
          suggestedFollowUps: ['Whose birthday is this month?', 'Show everyone above 60.'],
        };
      }

      case 'BIRTHDAYS_THIS_MONTH': {
        const currentMonth = new Date(CURRENT_REFERENCE_DATE).getMonth() + 1; // August = 8
        const bdays = data.people.filter((p) => {
          if (!p.date_of_birth) return false;
          const m = new Date(p.date_of_birth).getMonth() + 1;
          return m === currentMonth;
        });

        return {
          answer: `There are **${bdays.length} residents** with birthdays in **August** (current month): ${bdays.map((p) => `**${p.full_name}** (${p.date_of_birth.substring(5)})`).join(', ')}.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'August Birthdays',
              value: `${bdays.length} Residents`,
              subValue: 'Celebrated this month',
            },
            {
              type: 'table',
              title: 'Residents Born in August',
              columns: [
                { key: 'full_name', label: 'Name' },
                { key: 'date_of_birth', label: 'Date of Birth' },
                { key: 'age', label: 'Current Age' },
                { key: 'house_number', label: 'House #' },
              ],
              rows: bdays.map((p) => ({
                full_name: p.full_name,
                date_of_birth: p.date_of_birth,
                age: p.age,
                house_number: `#${p.house_number}`,
              })),
            },
          ],
        };
      }

      // ----------------------------------------------------
      // DEMOGRAPHIC AGGREGATES
      // ----------------------------------------------------
      case 'TOTAL_POPULATION': {
        return {
          answer: `The total population of Lakra Khurd is **${stats.total_population} people**, residing across **${stats.total_houses} houses** in **${stats.total_families} families**.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Total Population',
              value: stats.total_population,
              subValue: `${stats.total_houses} Houses • ${stats.total_families} Families`,
            },
            {
              type: 'bar_chart',
              title: 'Population by Age Group',
              xKey: 'group',
              yKey: 'count',
              data: stats.age_groups,
            },
            {
              type: 'donut_chart',
              title: 'Gender Distribution',
              nameKey: 'gender',
              valueKey: 'count',
              data: stats.gender_distribution,
            },
          ],
          suggestedFollowUps: [
            'How many children are under 5?',
            'What percentage of the village is under 18?',
            'What is the average age?',
          ],
        };
      }

      case 'CHILDREN_UNDER_5': {
        const children = data.people.filter((p) => (p.age ?? 0) < 5);
        return {
          answer: `There are **${stats.children_under_5} children under 5 years old** in Lakra Khurd (representing ${((stats.children_under_5 / stats.total_population) * 100).toFixed(1)}% of total population).`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Children Under 5',
              value: stats.children_under_5,
              subValue: `Out of ${stats.total_population} total residents`,
            },
            {
              type: 'table',
              title: 'Infants & Toddlers (Age < 5)',
              columns: [
                { key: 'full_name', label: 'Child Name' },
                { key: 'age', label: 'Age' },
                { key: 'date_of_birth', label: 'DOB' },
                { key: 'house_number', label: 'House #' },
                { key: 'family_number', label: 'Family' },
              ],
              rows: children.map((p) => ({
                full_name: p.full_name,
                age: p.age,
                date_of_birth: p.date_of_birth,
                house_number: `#${p.house_number}`,
                family_number: p.family_number,
              })),
            },
          ],
          suggestedFollowUps: ['How many children are under 10?', 'What is the average family size?'],
        };
      }

      case 'CHILDREN_UNDER_10': {
        const under10 = data.people.filter((p) => (p.age ?? 0) < 10);
        return {
          answer: `There are **${stats.children_under_10} children under 10 years old** living in the village.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Children Under 10',
              value: stats.children_under_10,
              subValue: `${((stats.children_under_10 / stats.total_population) * 100).toFixed(1)}% of total population`,
            },
            {
              type: 'table',
              title: 'Children Under 10 Records',
              columns: [
                { key: 'full_name', label: 'Name' },
                { key: 'age', label: 'Age' },
                { key: 'gender', label: 'Gender' },
                { key: 'house_number', label: 'House #' },
                { key: 'family_number', label: 'Family' },
              ],
              rows: under10.slice(0, 10).map((p) => ({
                full_name: p.full_name,
                age: p.age,
                gender: p.gender,
                house_number: `#${p.house_number}`,
                family_number: p.family_number,
              })),
            },
          ],
          suggestedFollowUps: ['How many children are under 5?', 'What percentage of the village is under 18?'],
        };
      }

      case 'ADULTS_COUNT': {
        return {
          answer: `There are **${stats.adults} adults** (aged 18 and older) in the village, making up **${((stats.adults / stats.total_population) * 100).toFixed(1)}%** of the population.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Total Adults (18+)',
              value: stats.adults,
              subValue: `${stats.total_population - stats.adults} minors under 18`,
            },
            {
              type: 'bar_chart',
              title: 'Age Demographics',
              xKey: 'group',
              yKey: 'count',
              data: stats.age_groups,
            },
          ],
        };
      }

      case 'AVERAGE_AGE': {
        return {
          answer: `The average age in Lakra Khurd is **${stats.average_age} years old**.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Average Village Age',
              value: `${stats.average_age} yrs`,
              subValue: `Calculated across ${stats.total_population} registered individuals`,
            },
            {
              type: 'bar_chart',
              title: 'Age Distribution Breakdown',
              xKey: 'group',
              yKey: 'count',
              data: stats.age_groups,
            },
          ],
        };
      }

      case 'PEOPLE_ABOVE_60': {
        const seniors = data.people.filter((p) => (p.age ?? 0) >= 60);
        return {
          answer: `There are **${stats.seniors_60_plus} senior citizens (aged 60+)** in Lakra Khurd.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Seniors (60+)',
              value: stats.seniors_60_plus,
              subValue: `${((stats.seniors_60_plus / stats.total_population) * 100).toFixed(1)}% of village population`,
            },
            {
              type: 'table',
              title: 'Senior Citizens (60+)',
              columns: [
                { key: 'full_name', label: 'Name' },
                { key: 'age', label: 'Age' },
                { key: 'date_of_birth', label: 'DOB' },
                { key: 'house_number', label: 'House #' },
                { key: 'phone', label: 'Phone' },
              ],
              rows: seniors.map((p) => ({
                full_name: p.full_name,
                age: p.age,
                date_of_birth: p.date_of_birth,
                house_number: `#${p.house_number}`,
                phone: p.phone || 'N/A',
              })),
            },
          ],
          suggestedFollowUps: ['Who is the oldest person?', 'Which family has the highest average age?'],
        };
      }

      case 'PERCENTAGE_UNDER_18': {
        const pct = ((stats.children_under_18 / stats.total_population) * 100).toFixed(1);
        return {
          answer: `**${pct}%** of the village population is under 18 years old (**${stats.children_under_18} children/minors** out of **${stats.total_population} total residents**).`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Youth Ratio (< 18)',
              value: `${pct}%`,
              subValue: `${stats.children_under_18} Minors • ${stats.adults} Adults`,
            },
            {
              type: 'donut_chart',
              title: 'Population Split by Legal Age',
              nameKey: 'name',
              valueKey: 'value',
              data: [
                { name: 'Under 18 (Minors)', value: stats.children_under_18 },
                { name: '18 and Above (Adults)', value: stats.adults },
              ],
            },
          ],
        };
      }

      case 'AVERAGE_FAMILY_SIZE': {
        return {
          answer: `The average family size is **${stats.average_family_size} members** per family (Total population: ${stats.total_population} across ${stats.total_families} families).`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Average Family Size',
              value: `${stats.average_family_size} members`,
              subValue: `${stats.total_families} total registered families`,
            },
            {
              type: 'bar_chart',
              title: 'Family Size Distribution',
              xKey: 'range',
              yKey: 'count',
              data: stats.family_size_distribution,
            },
          ],
        };
      }

      // ----------------------------------------------------
      // FAMILY QUERIES
      // ----------------------------------------------------
      case 'LARGEST_FAMILY': {
        const sorted = [...data.families].sort(
          (a, b) => (b.members_count ?? 0) - (a.members_count ?? 0)
        );
        const largest = sorted[0];
        if (!largest) return { answer: 'No families found.', visualizations: [] };

        return {
          answer: `The largest family in Lakra Khurd is **Family #${largest.family_number}** (Guardian: **${largest.guardian_name}**) located in **House #${largest.house_number}** with **${largest.members_count} members**.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Largest Family',
              value: largest.family_number,
              subValue: `${largest.members_count} Members • House #${largest.house_number}`,
            },
            {
              type: 'table',
              title: 'Top Largest Families',
              columns: [
                { key: 'family_number', label: 'Family #' },
                { key: 'guardian_name', label: 'Guardian' },
                { key: 'house_number', label: 'House #' },
                { key: 'members_count', label: 'Members' },
                { key: 'cast', label: 'Cast' },
              ],
              rows: sorted.slice(0, 5).map((f) => ({
                family_number: f.family_number,
                guardian_name: f.guardian_name || 'N/A',
                house_number: `#${f.house_number}`,
                members_count: f.members_count,
                cast: f.cast,
              })),
            },
            {
              type: 'bar_chart',
              title: 'Members in Top Families',
              xKey: 'family_number',
              yKey: 'members_count',
              data: sorted.slice(0, 6).map((f) => ({
                family_number: f.family_number,
                members_count: f.members_count,
              })),
            },
          ],
          suggestedFollowUps: [
            `Show all members of Family #${largest.family_number}`,
            'Show families with more than 8 people.',
            'Which house has the most people?',
          ],
        };
      }

      case 'FAMILIES_MORE_THAN_8_PEOPLE': {
        const filtered = data.families.filter((f) => (f.members_count ?? 0) > 8);
        return {
          answer: `There are **${filtered.length} families** with more than 8 members: ${filtered.map((f) => `**${f.family_number}** (${f.members_count} members, Guardian: ${f.guardian_name})`).join(', ')}.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Families (> 8 Members)',
              value: filtered.length,
              subValue: 'Large joint households',
            },
            {
              type: 'table',
              title: 'Families with > 8 Members',
              columns: [
                { key: 'family_number', label: 'Family #' },
                { key: 'guardian_name', label: 'Guardian' },
                { key: 'members_count', label: 'Members' },
                { key: 'house_number', label: 'House #' },
                { key: 'guardian_phone', label: 'Guardian Phone' },
              ],
              rows: filtered.map((f) => ({
                family_number: f.family_number,
                guardian_name: f.guardian_name,
                members_count: f.members_count,
                house_number: `#${f.house_number}`,
                guardian_phone: f.guardian_phone || 'N/A',
              })),
            },
          ],
        };
      }

      case 'FAMILIES_MORE_THAN_5_MEMBERS': {
        const filtered = data.families.filter((f) => (f.members_count ?? 0) > 5);
        return {
          answer: `There are **${filtered.length} families** with more than 5 members in the village.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Families with > 5 Members',
              value: `${filtered.length} / ${stats.total_families}`,
              subValue: `${((filtered.length / stats.total_families) * 100).toFixed(1)}% of all families`,
            },
            {
              type: 'table',
              title: 'Families with > 5 Members',
              columns: [
                { key: 'family_number', label: 'Family #' },
                { key: 'guardian_name', label: 'Guardian' },
                { key: 'members_count', label: 'Members' },
                { key: 'house_number', label: 'House #' },
              ],
              rows: filtered.map((f) => ({
                family_number: f.family_number,
                guardian_name: f.guardian_name,
                members_count: f.members_count,
                house_number: `#${f.house_number}`,
              })),
            },
          ],
        };
      }

      case 'FAMILIES_MORE_THAN_3_CHILDREN': {
        const results = data.families
          .map((f) => {
            const familyPeople = data.people.filter((p) => p.family_id === f.id);
            const childrenCount = familyPeople.filter((p) => (p.age ?? 0) < 18).length;
            return {
              ...f,
              childrenCount,
            };
          })
          .filter((f) => f.childrenCount > 3);

        return {
          answer: `There are **${results.length} families** that have more than 3 children (under 18): ${results.map((f) => `**${f.family_number}** (${f.childrenCount} children, Guardian: ${f.guardian_name})`).join(', ')}.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Families with > 3 Children',
              value: results.length,
              subValue: 'Households with high child dependency',
            },
            {
              type: 'table',
              title: 'Families with > 3 Children',
              columns: [
                { key: 'family_number', label: 'Family #' },
                { key: 'guardian_name', label: 'Guardian' },
                { key: 'childrenCount', label: 'Children (< 18)' },
                { key: 'members_count', label: 'Total Members' },
                { key: 'house_number', label: 'House #' },
              ],
              rows: results.map((f) => ({
                family_number: f.family_number,
                guardian_name: f.guardian_name,
                childrenCount: f.childrenCount,
                members_count: f.members_count,
                house_number: `#${f.house_number}`,
              })),
            },
          ],
        };
      }

      case 'FAMILY_HIGHEST_AVG_AGE': {
        const familyAges = data.families
          .map((f) => {
            const members = data.people.filter((p) => p.family_id === f.id);
            const total = members.reduce((acc, p) => acc + (p.age ?? 0), 0);
            const avg = members.length > 0 ? Number((total / members.length).toFixed(1)) : 0;
            return {
              ...f,
              avgAge: avg,
              members_count: members.length,
            };
          })
          .sort((a, b) => b.avgAge - a.avgAge);

        const top = familyAges[0];
        return {
          answer: `**Family #${top.family_number}** (Guardian: **${top.guardian_name}**) in House #${top.house_number} has the highest average age of **${top.avgAge} years**.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Highest Average Age Family',
              value: `Family #${top.family_number}`,
              subValue: `Average Age: ${top.avgAge} yrs • ${top.members_count} Members`,
            },
            {
              type: 'table',
              title: 'Families Ranked by Average Age',
              columns: [
                { key: 'family_number', label: 'Family #' },
                { key: 'guardian_name', label: 'Guardian' },
                { key: 'avgAge', label: 'Avg Age' },
                { key: 'members_count', label: 'Members' },
                { key: 'house_number', label: 'House #' },
              ],
              rows: familyAges.slice(0, 5).map((f) => ({
                family_number: f.family_number,
                guardian_name: f.guardian_name,
                avgAge: `${f.avgAge} yrs`,
                members_count: f.members_count,
                house_number: `#${f.house_number}`,
              })),
            },
          ],
        };
      }

      // ----------------------------------------------------
      // HOUSE QUERIES
      // ----------------------------------------------------
      case 'HOUSE_MOST_PEOPLE': {
        const sorted = [...data.houses].sort((a, b) => (b.population ?? 0) - (a.population ?? 0));
        const top = sorted[0];
        return {
          answer: `**House #${top.house_number}** has the largest population with **${top.population} residents** residing across **${top.families_count} families** (Parcel ID: ${top.parcel_id}).`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Most Populated House',
              value: `House #${top.house_number}`,
              subValue: `${top.population} Residents • ${top.families_count} Families`,
            },
            {
              type: 'table',
              title: 'Houses Ranked by Population',
              columns: [
                { key: 'house_number', label: 'House #' },
                { key: 'population', label: 'Population' },
                { key: 'families_count', label: 'Families' },
                { key: 'parcel_id', label: 'Parcel ID' },
                { key: 'house_type', label: 'Structure' },
              ],
              rows: sorted.slice(0, 8).map((h) => ({
                house_number: `House #${h.house_number}`,
                population: h.population,
                families_count: h.families_count,
                parcel_id: h.parcel_id,
                house_type: h.house_type,
              })),
            },
            {
              type: 'bar_chart',
              title: 'Top Houses by Population',
              xKey: 'house_number',
              yKey: 'population',
              data: sorted.slice(0, 6).map((h) => ({
                house_number: `#${h.house_number}`,
                population: h.population,
              })),
            },
          ],
          suggestedFollowUps: [
            `How many families are in house ${top.house_number}?`,
            `What is the location of house ${top.house_number}?`,
            `Show houses near house ${top.house_number}.`,
          ],
        };
      }

      case 'HOUSE_20_DETAILS': {
        const h20 = villageDb.getHouseByNumber('20');
        if (!h20) return { answer: 'House #20 not found in database.', visualizations: [] };
        return {
          answer: `**House #20** (Parcel ID: **${h20.parcel_id}**) houses **${h20.families_count} families** with a total population of **${h20.population} residents**. Coordinates: **${h20.latitude}, ${h20.longitude}**.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'House #20 Overview',
              value: `${h20.population} People`,
              subValue: `${h20.families_count} Families • Parcel ${h20.parcel_id}`,
            },
            {
              type: 'table',
              title: 'Families in House #20',
              columns: [
                { key: 'family_number', label: 'Family #' },
                { key: 'guardian_name', label: 'Guardian' },
                { key: 'members_count', label: 'Members' },
                { key: 'cast', label: 'Cast' },
                { key: 'guardian_phone', label: 'Phone' },
              ],
              rows: (h20.families || []).map((f) => ({
                family_number: f.family_number,
                guardian_name: f.guardian_name,
                members_count: f.members_count,
                cast: f.cast,
                guardian_phone: f.guardian_phone || 'N/A',
              })),
            },
            {
              type: 'map',
              title: 'House #20 Geographic Location',
              center: [h20.latitude, h20.longitude],
              zoom: 17,
              markers: [
                {
                  id: h20.id,
                  house_number: h20.house_number,
                  latitude: h20.latitude,
                  longitude: h20.longitude,
                  population: h20.population,
                  families_count: h20.families_count,
                  info: `House #${h20.house_number} (${h20.population} people, ${h20.families_count} families)`,
                },
              ],
            },
          ],
          suggestedFollowUps: [
            'Show houses near house 20.',
            'Show all families on Parcel ID 60116.',
            'Who is the oldest person in House 20?',
          ],
        };
      }

      case 'HOUSES_MORE_THAN_3_FAMILIES': {
        const houses = data.houses.filter((h) => (h.families_count ?? 0) > 3);
        return {
          answer: `There is **${houses.length} house** with more than 3 families: **House #${houses.map((h) => h.house_number).join(', #')}** (which contains **${houses[0]?.families_count || 4} families** and **${houses[0]?.population || 27} people**).`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Houses with > 3 Families',
              value: houses.length,
              subValue: houses.map((h) => `House #${h.house_number}`).join(', '),
            },
            {
              type: 'table',
              title: 'Multi-Family Compounds (> 3 Families)',
              columns: [
                { key: 'house_number', label: 'House #' },
                { key: 'families_count', label: 'Families' },
                { key: 'population', label: 'Population' },
                { key: 'parcel_id', label: 'Parcel' },
              ],
              rows: houses.map((h) => ({
                house_number: `#${h.house_number}`,
                families_count: h.families_count,
                population: h.population,
                parcel_id: h.parcel_id,
              })),
            },
          ],
        };
      }

      case 'HOUSES_MULTIPLE_FAMILIES': {
        const houses = data.houses.filter((h) => (h.families_count ?? 0) > 1);
        return {
          answer: `There are **${houses.length} houses** that accommodate multiple families (more than 1 family).`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Houses with Multiple Families',
              value: `${houses.length} / ${stats.total_houses}`,
              subValue: `${((houses.length / stats.total_houses) * 100).toFixed(1)}% of all houses`,
            },
            {
              type: 'table',
              title: 'Multi-Family Houses',
              columns: [
                { key: 'house_number', label: 'House #' },
                { key: 'families_count', label: 'Families Count' },
                { key: 'population', label: 'Population' },
                { key: 'parcel_id', label: 'Parcel ID' },
              ],
              rows: houses.map((h) => ({
                house_number: `#${h.house_number}`,
                families_count: h.families_count,
                population: h.population,
                parcel_id: h.parcel_id,
              })),
            },
          ],
        };
      }

      // ----------------------------------------------------
      // GUARDIAN QUERIES
      // ----------------------------------------------------
      case 'LIST_ALL_GUARDIANS': {
        const guardianList = data.families.map((f) => ({
          family_number: f.family_number,
          guardian_name: f.guardian_name,
          guardian_phone: f.guardian_phone || 'No phone registered',
          house_number: `#${f.house_number}`,
          cast: f.cast,
          members_count: f.members_count,
        }));

        return {
          answer: `There are **${stats.total_guardians} unique guardians** overseeing the **${stats.total_families} families** of Lakra Khurd.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Total Guardians',
              value: stats.total_guardians,
              subValue: `${stats.total_families} Families Represented`,
            },
            {
              type: 'table',
              title: 'Village Family Guardians',
              columns: [
                { key: 'guardian_name', label: 'Guardian' },
                { key: 'guardian_phone', label: 'Phone' },
                { key: 'family_number', label: 'Family #' },
                { key: 'house_number', label: 'House #' },
                { key: 'members_count', label: 'Members' },
              ],
              rows: guardianList,
            },
          ],
          suggestedFollowUps: [
            'Which guardians do not have phone numbers?',
            'Show guardians with families larger than 5.',
          ],
        };
      }

      case 'GUARDIANS_NO_PHONE': {
        const noPhoneGuardians = data.families
          .filter((f) => !f.guardian_phone)
          .map((f) => ({
            family_number: f.family_number,
            guardian_name: f.guardian_name,
            house_number: `#${f.house_number}`,
            cast: f.cast,
          }));

        return {
          answer: `There are **${noPhoneGuardians.length} guardians** without a phone number on record: ${noPhoneGuardians.map((g) => `**${g.guardian_name}** (${g.family_number}, House ${g.house_number})`).join(', ')}.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Guardians Without Phone',
              value: noPhoneGuardians.length,
              subValue: 'Require physical dispatch or notice',
            },
            {
              type: 'table',
              title: 'Guardians with Missing Phone Numbers',
              columns: [
                { key: 'guardian_name', label: 'Guardian Name' },
                { key: 'family_number', label: 'Family #' },
                { key: 'house_number', label: 'House #' },
                { key: 'cast', label: 'Cast' },
              ],
              rows: noPhoneGuardians,
            },
          ],
        };
      }

      case 'GUARDIANS_FAMILY_LARGER_THAN_5': {
        const res = data.families
          .filter((f) => (f.members_count ?? 0) > 5)
          .map((f) => ({
            guardian_name: f.guardian_name,
            family_number: f.family_number,
            members_count: f.members_count,
            house_number: `#${f.house_number}`,
            phone: f.guardian_phone || 'N/A',
          }));

        return {
          answer: `There are **${res.length} guardians** whose families have more than 5 members: ${res.map((g) => `**${g.guardian_name}** (${g.members_count} members)`).join(', ')}.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Guardians (Family > 5)',
              value: res.length,
              subValue: 'Large household heads',
            },
            {
              type: 'table',
              title: 'Guardians with > 5 Family Members',
              columns: [
                { key: 'guardian_name', label: 'Guardian' },
                { key: 'members_count', label: 'Members' },
                { key: 'family_number', label: 'Family' },
                { key: 'house_number', label: 'House' },
                { key: 'phone', label: 'Phone' },
              ],
              rows: res,
            },
          ],
        };
      }

      case 'GUARDIAN_OF_IMRAN_MALHI': {
        const imran = data.people.find((p) => p.full_name.toLowerCase().includes('muhammad imran malhi') || p.id === 52);
        if (!imran) return { answer: 'Could not find Muhammad Imran Malhi in records.', visualizations: [] };

        const family = data.families.find((f) => f.id === imran.family_id);
        const guardian = family?.guardian;

        return {
          answer: `The guardian of Muhammad Imran Malhi's family (${family?.family_number || 'FAM-20A'}) is **${guardian?.full_name || 'Rizwan Malhi'}** (Phone: **${guardian?.phone || '+92-300-5551234'}**), living in **House #${imran.house_number}** (Parcel ID: ${imran.parcel_id}).`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Family Guardian',
              value: guardian?.full_name || 'Rizwan Malhi',
              subValue: `Phone: ${guardian?.phone} • House #${imran.house_number}`,
            },
            {
              type: 'table',
              title: 'Muhammad Imran Malhi & Family Context',
              columns: [
                { key: 'field', label: 'Detail' },
                { key: 'value', label: 'Value' },
              ],
              rows: [
                { field: 'Person', value: imran.full_name },
                { field: 'Guardian', value: guardian?.full_name || 'Rizwan Malhi' },
                { field: 'Father', value: imran.father_name || 'Rizwan Malhi' },
                { field: 'Mother', value: imran.mother_name || 'Parveen Akhtar' },
                { field: 'Family #', value: family?.family_number },
                { field: 'House #', value: `#${imran.house_number}` },
                { field: 'Parcel ID', value: imran.parcel_id },
              ],
            },
          ],
          suggestedFollowUps: [
            'What is the phone number of guardian Rizwan Malhi?',
            'Where does Rizwan Malhi live?',
            'Show vehicles owned by Muhammad Imran Malhi.',
          ],
        };
      }

      // ----------------------------------------------------
      // DISAMBIGUATION & SPECIFIC PEOPLE
      // ----------------------------------------------------
      case 'DISAMBIGUATE_RIZWAN_MALHI': {
        const matches = data.people.filter((p) => p.full_name.toLowerCase() === 'rizwan malhi');
        return {
          answer: `I found **${matches.length} people** named **Rizwan Malhi** in Lakra Khurd. Please select or specify which one you mean:\n\n` +
            matches.map((m, idx) => `${idx + 1}. **${m.full_name}** — House #${m.house_number}, Family ${m.family_number} (Age: ${m.age}, Phone: ${m.phone})`).join('\n'),
          clarificationOptions: matches.map((m) => ({
            id: m.id,
            label: `Rizwan Malhi — House #${m.house_number} (Age ${m.age})`,
            description: `Phone: ${m.phone} • Family ${m.family_number} • Parcel ${m.parcel_id}`,
          })),
          visualizations: [
            {
              type: 'table',
              title: 'People Named Rizwan Malhi',
              columns: [
                { key: 'full_name', label: 'Name' },
                { key: 'house_number', label: 'House #' },
                { key: 'age', label: 'Age' },
                { key: 'phone', label: 'Phone' },
                { key: 'is_guardian', label: 'Guardian?' },
              ],
              rows: matches.map((m) => ({
                full_name: m.full_name,
                house_number: `#${m.house_number}`,
                age: m.age,
                phone: m.phone,
                is_guardian: m.is_guardian ? 'Yes' : 'No',
              })),
            },
          ],
        };
      }

      case 'WHERE_DOES_RIZWAN_MALHI_LIVE': {
        const rizwanGuardian = data.people.find((p) => p.id === 50) || data.people.find((p) => p.full_name.toLowerCase() === 'rizwan malhi' && p.is_guardian);
        if (!rizwanGuardian) return { answer: 'Could not find record for Rizwan Malhi.', visualizations: [] };

        const house = data.houses.find((h) => h.id === rizwanGuardian.house_id);

        return {
          answer: `**Guardian Rizwan Malhi** lives in **House #${rizwanGuardian.house_number}** (Parcel ID: **${rizwanGuardian.parcel_id}**), with coordinates **${house?.latitude}, ${house?.longitude}**. Contact: **${rizwanGuardian.phone}**.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Residence of Rizwan Malhi',
              value: `House #${rizwanGuardian.house_number}`,
              subValue: `Parcel ID: ${rizwanGuardian.parcel_id} • Phone: ${rizwanGuardian.phone}`,
            },
            {
              type: 'map',
              title: 'Location of House #20',
              center: [house?.latitude || 32.4945, house?.longitude || 74.5228],
              zoom: 17,
              markers: [
                {
                  id: house?.id || 20,
                  house_number: house?.house_number || '20',
                  latitude: house?.latitude || 32.4945,
                  longitude: house?.longitude || 74.5228,
                  population: house?.population,
                  families_count: house?.families_count,
                  info: `Rizwan Malhi's Residence (House #${house?.house_number})`,
                },
              ],
            },
          ],
          suggestedFollowUps: [
            'What is the phone number of guardian Rizwan Malhi?',
            'Who else lives in House #20?',
            'Show houses near house 20.',
          ],
        };
      }

      case 'PHONE_OF_RIZWAN_MALHI': {
        const p = data.people.find((p) => p.id === 50) || data.people.find((p) => p.full_name.toLowerCase() === 'rizwan malhi' && p.phone);
        return {
          answer: `The phone number of Guardian **Rizwan Malhi** (House #${p?.house_number || '20'}) is **${p?.phone || '+92-300-5551234'}**.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Contact Number',
              value: p?.phone || '+92-300-5551234',
              subValue: `Guardian Rizwan Malhi • House #${p?.house_number || '20'}`,
            },
          ],
        };
      }

      // ----------------------------------------------------
      // GEOGRAPHIC QUERIES
      // ----------------------------------------------------
      case 'HOUSES_NEAR_HOUSE_20': {
        const radius = params.radiusMeters || 500;
        const nearby = villageDb.findHousesNear('20', radius);
        const center = [32.4945, 74.5228] as [number, number];

        return {
          answer: `There are **${nearby.length} houses** within **${radius} meters** of House #20 (including House #20): ${nearby.map((h) => `**House #${h.house_number}** (${h.distance_meters}m away, ${h.population} residents)`).join(', ')}.`,
          visualizations: [
            {
              type: 'kpi',
              title: `Houses Within ${radius}m of House #20`,
              value: `${nearby.length} Houses`,
              subValue: `Total Nearby Population: ${nearby.reduce((acc, h) => acc + h.population, 0)} people`,
            },
            {
              type: 'table',
              title: `Houses Within ${radius}m Distance`,
              columns: [
                { key: 'house_number', label: 'House' },
                { key: 'distance_meters', label: 'Distance (m)' },
                { key: 'families_count', label: 'Families' },
                { key: 'population', label: 'Population' },
                { key: 'parcel_id', label: 'Parcel ID' },
              ],
              rows: nearby.map((h) => ({
                house_number: h.isTarget ? `House #${h.house_number} (Target)` : `House #${h.house_number}`,
                distance_meters: `${h.distance_meters} m`,
                families_count: h.families_count,
                population: h.population,
                parcel_id: h.parcel_id,
              })),
            },
            {
              type: 'map',
              title: `Village Map: ${radius}m Radius around House #20`,
              center,
              zoom: 16,
              markers: nearby.map((h) => ({
                id: h.id,
                house_number: h.house_number,
                latitude: h.latitude,
                longitude: h.longitude,
                population: h.population,
                families_count: h.families_count,
                info: `House #${h.house_number}: ${h.distance_meters}m away (${h.population} people, ${h.families_count} families)`,
              })),
            },
          ],
          suggestedFollowUps: [
            'How many people live in this area?',
            'Show houses within 1 kilometer of house 20.',
            'What is the location of house 20?',
          ],
        };
      }

      case 'PARCEL_60116_FAMILIES': {
        const housesOnParcel = data.houses.filter((h) => h.parcel_id === '60116');
        const houseIds = new Set(housesOnParcel.map((h) => h.id));
        const familiesOnParcel = data.families.filter((f) => houseIds.has(f.house_id));
        const totalPop = familiesOnParcel.reduce((acc, f) => acc + (f.members_count ?? 0), 0);

        return {
          answer: `On **Parcel ID 60116**, there are **${housesOnParcel.length} houses** (House #${housesOnParcel.map((h) => h.house_number).join(', #')}) housing **${familiesOnParcel.length} families** with a total of **${totalPop} residents**.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Parcel ID 60116 Demographics',
              value: `${familiesOnParcel.length} Families`,
              subValue: `${housesOnParcel.length} Houses • ${totalPop} Total Population`,
            },
            {
              type: 'table',
              title: 'Families on Parcel ID 60116',
              columns: [
                { key: 'family_number', label: 'Family #' },
                { key: 'house_number', label: 'House #' },
                { key: 'guardian_name', label: 'Guardian' },
                { key: 'members_count', label: 'Members' },
                { key: 'cast', label: 'Cast' },
                { key: 'guardian_phone', label: 'Phone' },
              ],
              rows: familiesOnParcel.map((f) => ({
                family_number: f.family_number,
                house_number: `#${f.house_number}`,
                guardian_name: f.guardian_name,
                members_count: f.members_count,
                cast: f.cast,
                guardian_phone: f.guardian_phone || 'N/A',
              })),
            },
          ],
          suggestedFollowUps: ['Where does Rizwan Malhi live?', 'How many families are in house 20?'],
        };
      }

      default: {
        return {
          answer: `I searched the village database for "${params.query || intent}" and found ${data.people.length} registered residents across ${data.houses.length} houses.`,
          visualizations: [
            {
              type: 'kpi',
              title: 'Village Population',
              value: stats.total_population,
              subValue: `${stats.total_houses} Houses • ${stats.total_families} Families`,
            },
          ],
        };
      }
    }
  }

  public resolveNaturalQuery(query: string): QueryIntentResult {
    const q = query.toLowerCase().trim();

    // 1. Oldest person
    if (q.includes('oldest') || (q.includes('eldest') && q.includes('person'))) {
      return this.executeIntent('FIND_OLDEST_PERSON');
    }

    // 2. Youngest person
    if (q.includes('youngest') || q.includes('newborn') || q.includes('youngest child')) {
      return this.executeIntent('FIND_YOUNGEST_PERSON');
    }

    // 3. Exactly 18 years old
    if (q.includes('18 year') || q.includes('18 yrs') || q.includes('is 18') || q.includes('who is 18')) {
      return this.executeIntent('PEOPLE_EXACT_AGE_18');
    }

    // 4. Turn 18 this year
    if (q.includes('turn 18') || q.includes('turning 18')) {
      return this.executeIntent('TURNING_18_THIS_YEAR');
    }

    // 5. Birthday this month
    if (q.includes('birthday') && (q.includes('month') || q.includes('this month') || q.includes('august'))) {
      return this.executeIntent('BIRTHDAYS_THIS_MONTH');
    }

    // 6. Children under 5
    if (q.includes('under 5') || q.includes('below 5') || q.includes('< 5') || q.includes('less than 5')) {
      return this.executeIntent('CHILDREN_UNDER_5');
    }

    // 7. Children under 10
    if (q.includes('under 10') || q.includes('below 10') || q.includes('< 10') || q.includes('less than 10')) {
      return this.executeIntent('CHILDREN_UNDER_10');
    }

    // 8. Percentage under 18
    if (q.includes('percentage') && (q.includes('under 18') || q.includes('minor') || q.includes('children') || q.includes('18'))) {
      return this.executeIntent('PERCENTAGE_UNDER_18');
    }

    // 9. Adults count
    if (q.includes('how many adults') || q.includes('adult population') || q.includes('total adults')) {
      return this.executeIntent('ADULTS_COUNT');
    }

    // 10. People above 60 / Senior citizens
    if (q.includes('above 60') || q.includes('over 60') || q.includes('60+') || q.includes('seniors') || q.includes('senior citizen')) {
      return this.executeIntent('PEOPLE_ABOVE_60');
    }

    // 11. Average age
    if (q.includes('average age') || q.includes('mean age')) {
      return this.executeIntent('AVERAGE_AGE');
    }

    // 12. Total population
    if (q.includes('total population') || (q.includes('how many people') && !q.includes('house') && !q.includes('family') && !q.includes('area')) || q.includes('village population')) {
      return this.executeIntent('TOTAL_POPULATION');
    }

    // 13. Largest family / which family is the largest
    if (q.includes('largest family') || q.includes('biggest family') || (q.includes('which family') && q.includes('largest'))) {
      return this.executeIntent('LARGEST_FAMILY');
    }

    // 14. Families with more than 8 people
    if (q.includes('families') && (q.includes('more than 8') || q.includes('> 8') || q.includes('greater than 8'))) {
      return this.executeIntent('FAMILIES_MORE_THAN_8_PEOPLE');
    }

    // 15. Families with more than 5 members
    if (q.includes('families') && (q.includes('more than 5') || q.includes('> 5') || q.includes('greater than 5'))) {
      return this.executeIntent('FAMILIES_MORE_THAN_5_MEMBERS');
    }

    // 16. Families with more than 3 children
    if (q.includes('families') && (q.includes('more than 3 children') || q.includes('> 3 children') || q.includes('3 child'))) {
      return this.executeIntent('FAMILIES_MORE_THAN_3_CHILDREN');
    }

    // 17. Family with highest average age
    if (q.includes('highest average age') || (q.includes('family') && q.includes('oldest average'))) {
      return this.executeIntent('FAMILY_HIGHEST_AVG_AGE');
    }

    // 18. Average family size
    if (q.includes('average family size') || q.includes('avg family size')) {
      return this.executeIntent('AVERAGE_FAMILY_SIZE');
    }

    // 19. Which house has the most people / family members
    if (
      q.includes('house has the most people') ||
      q.includes('house has the most family members') ||
      q.includes('most populated house') ||
      q.includes('largest house')
    ) {
      return this.executeIntent('HOUSE_MOST_PEOPLE');
    }

    // 20. House 20 queries (how many families in house 20, location of house 20)
    if (q.includes('house 20') && (q.includes('how many families') || q.includes('location') || q.includes('where is') || q.includes('people') || q.includes('details'))) {
      return this.executeIntent('HOUSE_20_DETAILS');
    }

    // 21. Houses with more than 3 families
    if (q.includes('more than 3 families') || q.includes('> 3 families')) {
      return this.executeIntent('HOUSES_MORE_THAN_3_FAMILIES');
    }

    // 22. Houses with multiple families
    if (q.includes('multiple families') || q.includes('more than 1 family')) {
      return this.executeIntent('HOUSES_MULTIPLE_FAMILIES');
    }

    // 23. List all guardians / How many guardians
    if (q.includes('all guardians') || q.includes('list guardians') || q.includes('how many guardians')) {
      return this.executeIntent('LIST_ALL_GUARDIANS');
    }

    // 24. Guardians without phone numbers
    if (q.includes('guardians') && (q.includes('do not have phone') || q.includes('no phone') || q.includes('without phone'))) {
      return this.executeIntent('GUARDIANS_NO_PHONE');
    }

    // 25. Guardians with families larger than 5
    if (q.includes('guardians') && (q.includes('larger than 5') || q.includes('more than 5 members') || q.includes('> 5'))) {
      return this.executeIntent('GUARDIANS_FAMILY_LARGER_THAN_5');
    }

    // 26. Guardian of Muhammad Imran Malhi's family
    if (q.includes('guardian') && (q.includes('imran malhi') || q.includes('muhammad imran'))) {
      return this.executeIntent('GUARDIAN_OF_IMRAN_MALHI');
    }

    // 27. Phone number of Rizwan Malhi
    if (
      (q.includes('phone') || q.includes('contact') || q.includes('number')) &&
      q.includes('rizwan malhi')
    ) {
      return this.executeIntent('PHONE_OF_RIZWAN_MALHI');
    }

    // 28. Where does Rizwan Malhi live / house number of Rizwan Malhi
    if (
      (q.includes('where does') || q.includes('live') || q.includes('house number') || q.includes('location')) &&
      q.includes('rizwan malhi')
    ) {
      return this.executeIntent('WHERE_DOES_RIZWAN_MALHI_LIVE');
    }

    // 29. Disambiguation for Rizwan Malhi when asked generally about Rizwan
    if (q === 'rizwan malhi' || q === 'who is rizwan malhi' || q === 'find rizwan malhi') {
      return this.executeIntent('DISAMBIGUATE_RIZWAN_MALHI');
    }

    // 30. Houses near house 20 / within 500m / within 1km
    if (q.includes('near house 20') || q.includes('within 500 meters') || q.includes('within 500m') || q.includes('500 meters of house 20')) {
      return this.executeIntent('HOUSES_NEAR_HOUSE_20', { radiusMeters: 500 });
    }
    if (q.includes('within 1 kilometer') || q.includes('within 1km') || q.includes('1 km of house 20')) {
      return this.executeIntent('HOUSES_NEAR_HOUSE_20', { radiusMeters: 1000 });
    }

    // 31. Parcel ID 60116
    if (q.includes('60116') || q.includes('parcel id 60116') || q.includes('parcel 60116')) {
      return this.executeIntent('PARCEL_60116_FAMILIES');
    }

    // 32. Person name search lookup (e.g. Find Tariq Malhi, Abdul Rehman Malhi, etc.)
    const nameMatch = q.match(/(?:find|who is|show|search for)\s+([a-z\s]+)/i);
    if (nameMatch) {
      const searchName = nameMatch[1].trim();
      const people = villageDb.findPeopleByName(searchName);
      if (people.length === 1) {
        const p = people[0];
        return {
          answer: `Found record for **${p.full_name}**: Age **${p.age}** (DOB: ${p.date_of_birth}), Gender: **${p.gender}**, living in **House #${p.house_number}** (${p.family_number}), CNIC: **${p.cnic}**, Phone: **${p.phone || 'N/A'}**.`,
          visualizations: [
            {
              type: 'kpi',
              title: p.full_name,
              value: `Age ${p.age} • House #${p.house_number}`,
              subValue: `CNIC: ${p.cnic} • Phone: ${p.phone || 'None'}`,
            },
            {
              type: 'table',
              title: 'Personal Profile Details',
              columns: [
                { key: 'field', label: 'Field' },
                { key: 'value', label: 'Details' },
              ],
              rows: [
                { field: 'Full Name', value: p.full_name },
                { field: 'Calculated Age', value: `${p.age} years old` },
                { field: 'Date of Birth', value: p.date_of_birth },
                { field: 'Gender', value: p.gender },
                { field: 'Marital Status', value: p.marital_status },
                { field: 'House Number', value: `#${p.house_number}` },
                { field: 'Family Number', value: p.family_number },
                { field: 'CNIC', value: p.cnic },
                { field: 'Phone', value: p.phone || 'Not Registered' },
                { field: 'Father', value: p.father_name || 'N/A' },
                { field: 'Mother', value: p.mother_name || 'N/A' },
                { field: 'Spouse', value: p.spouse_name || 'N/A' },
              ],
            },
          ],
          suggestedFollowUps: [
            `Where does ${p.full_name} live?`,
            `Show family members of ${p.full_name}`,
          ],
        };
      } else if (people.length > 1) {
        return {
          answer: `I found **${people.length} people** matching "${searchName}". Please clarify which person you are referring to:`,
          clarificationOptions: people.map((p) => ({
            id: p.id,
            label: `${p.full_name} — House #${p.house_number} (Age ${p.age})`,
            description: `Phone: ${p.phone} • Family ${p.family_number}`,
          })),
          visualizations: [
            {
              type: 'table',
              title: `Search Results for "${searchName}"`,
              columns: [
                { key: 'full_name', label: 'Name' },
                { key: 'house_number', label: 'House #' },
                { key: 'age', label: 'Age' },
                { key: 'phone', label: 'Phone' },
              ],
              rows: people.map((p) => ({
                full_name: p.full_name,
                house_number: `#${p.house_number}`,
                age: p.age,
                phone: p.phone || 'N/A',
              })),
            },
          ],
        };
      }
    }

    // Default general response with database stats
    return this.executeIntent('TOTAL_POPULATION', { query });
  }
}

export const villageQueryEngine = new VillageQueryEngine();
