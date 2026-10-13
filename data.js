/* Touchline — world data: leagues, clubs, nations, name pools. */
"use strict";

// Club rows: "Name|ABV|rating|primary|secondary"
const LEAGUE_DATA = [
  { id: "ENG1", country: "England", nat: "ENG", name: "Premier League", tier: 1, money: 1.0, dom: 0.35, down: 3, region: "EU", clubs: `
Arsenal|ARS|87|#EF0107|#FFFFFF
Aston Villa|AVL|80|#670E36|#95BFE5
Bournemouth|BOU|75|#DA291C|#111111
Brentford|BRE|75|#E30613|#FFFFFF
Brighton & Hove Albion|BHA|77|#0057B8|#FFFFFF
Burnley|BUR|70|#6C1D45|#99D6EA
Chelsea|CHE|84|#034694|#FFFFFF
Crystal Palace|CRY|77|#1B458F|#C4122E
Everton|EVE|74|#003399|#FFFFFF
Fulham|FUL|75|#F5F5F5|#111111
Leeds United|LEE|71|#F5F5F5|#1D428A
Liverpool|LIV|87|#C8102E|#F6EB61
Manchester City|MCI|87|#6CABDD|#1C2C5B
Manchester United|MUN|81|#DA291C|#FBE122
Newcastle United|NEW|82|#241F20|#FFFFFF
Nottingham Forest|NFO|77|#DD0000|#FFFFFF
Sunderland|SUN|71|#EB172B|#FFFFFF
Tottenham Hotspur|TOT|81|#F5F5F5|#132257
West Ham United|WHU|75|#7A263A|#1BB1E7
Wolverhampton|WOL|74|#FDB913|#231F20` },
  { id: "ENG2", country: "England", nat: "ENG", name: "Championship", tier: 2, money: 0.18, dom: 0.7, down: 3, up: 3, region: "EU", clubs: `
Birmingham City|BIR|68|#0000FF|#FFFFFF
Blackburn Rovers|BLB|65|#009EE0|#FFFFFF
Bristol City|BRC|66|#E21A23|#FFFFFF
Charlton Athletic|CHA|62|#D4021D|#FFFFFF
Coventry City|COV|68|#59CBE8|#FFFFFF
Derby County|DER|64|#F5F5F5|#111111
Hull City|HUL|64|#F5A12D|#111111
Ipswich Town|IPS|70|#0044A9|#FFFFFF
Leicester City|LEI|70|#003090|#FDBE11
Middlesbrough|MID|68|#E11B22|#FFFFFF
Millwall|MIL|65|#001E5A|#FFFFFF
Norwich City|NOR|66|#FFF200|#00A650
Oxford United|OXF|62|#FFD100|#001A4B
Portsmouth|POR|63|#001489|#FFFFFF
Preston North End|PNE|64|#F5F5F5|#001F5B
Queens Park Rangers|QPR|63|#1D5BA4|#FFFFFF
Sheffield United|SHU|67|#EE2737|#FFFFFF
Sheffield Wednesday|SHW|61|#0E00F7|#FFFFFF
Southampton|SOU|70|#D71920|#FFFFFF
Stoke City|STK|64|#E03A3E|#FFFFFF
Swansea City|SWA|64|#F5F5F5|#111111
Watford|WAT|65|#FBEE23|#ED2127
West Bromwich Albion|WBA|66|#122F67|#FFFFFF
Wrexham|WRE|64|#D71920|#FFFFFF` },
  { id: "ENG3", country: "England", nat: "ENG", name: "League One", tier: 3, money: 0.05, dom: 0.85, up: 3, region: "EU", clubs: `
AFC Wimbledon|WIM|56|#1A3B79|#FFD700
Barnsley|BAR|59|#E31B23|#FFFFFF
Blackpool|BPL|59|#F68712|#FFFFFF
Bolton Wanderers|BOL|61|#F5F5F5|#263C7E
Bradford City|BRA|57|#8B0000|#FFB81C
Burton Albion|BUR|55|#FFD200|#111111
Cardiff City|CAR|61|#0070B5|#FFFFFF
Doncaster Rovers|DON|57|#E1261C|#FFFFFF
Exeter City|EXE|55|#E20E0E|#FFFFFF
Huddersfield Town|HUD|60|#0E63AD|#FFFFFF
Leyton Orient|LEY|57|#E2231A|#FFFFFF
Lincoln City|LIN|57|#E30613|#FFFFFF
Luton Town|LUT|62|#F78F1E|#002D62
Mansfield Town|MAN|56|#F5C518|#003C82
Northampton Town|NTH|55|#7C1E3C|#FFFFFF
Peterborough United|PET|57|#005EB8|#FFFFFF
Plymouth Argyle|PLY|59|#004F3D|#FFFFFF
Port Vale|PVA|55|#F5F5F5|#111111
Reading|REA|58|#004494|#FFFFFF
Rotherham United|ROT|57|#E30613|#FFFFFF
Stevenage|STE|56|#E30613|#FFFFFF
Stockport County|STO|59|#0B4EA2|#FFFFFF
Wigan Athletic|WIG|58|#1D59AF|#FFFFFF
Wycombe Wanderers|WYC|58|#87CEEB|#002D62` },
  { id: "ESP1", country: "Spain", nat: "ESP", name: "La Liga", tier: 1, money: 0.62, dom: 0.62, down: 3, region: "EU", clubs: `
Alavés|ALA|71|#0761AF|#FFFFFF
Athletic Club|ATH|79|#EE2523|#FFFFFF
Atlético Madrid|ATM|84|#CB3524|#FFFFFF
Barcelona|BAR|87|#A50044|#004D98
Celta Vigo|CEL|74|#8AC3EE|#FFFFFF
Elche|ELC|69|#F5F5F5|#05642C
Espanyol|ESP|71|#007FC8|#FFFFFF
Getafe|GET|71|#005999|#FFFFFF
Girona|GIR|74|#E2001A|#FFFFFF
Levante|LEV|68|#00427E|#B4053F
Mallorca|MLL|71|#E20613|#111111
Osasuna|OSA|72|#D91A21|#0A346F
Rayo Vallecano|RAY|72|#F5F5F5|#E53027
Real Betis|BET|77|#00954C|#FFFFFF
Real Madrid|RMA|88|#F5F5F5|#FEBE10
Real Oviedo|OVI|67|#0055A4|#FFFFFF
Real Sociedad|RSO|76|#0067B1|#FFFFFF
Sevilla|SEV|74|#F5F5F5|#D81E05
Valencia|VAL|73|#F5F5F5|#EE7D00
Villarreal|VIL|79|#FFE667|#005187` },
  { id: "ESP2", country: "Spain", nat: "ESP", name: "Segunda División", tier: 2, money: 0.08, dom: 0.82, up: 3, region: "EU", clubs: `
Albacete|ALB|62|#F5F5F5|#C8102E
Almería|ALM|67|#EE1119|#FFFFFF
Andorra|AND|61|#0D2C6C|#F6C900
Burgos|BUR|62|#F5F5F5|#111111
Cádiz|CAD|64|#FDE100|#0047AB
Castellón|CAS|62|#F5F5F5|#111111
Ceuta|CEU|58|#F5F5F5|#111111
Córdoba|COR|61|#F5F5F5|#00843D
Cultural Leonesa|CUL|58|#F5F5F5|#0055A4
Deportivo La Coruña|DEP|64|#0055A4|#FFFFFF
Eibar|EIB|62|#A6192E|#003DA5
Granada|GRA|64|#C8102E|#FFFFFF
Huesca|HUE|60|#0033A0|#A6192E
Las Palmas|LPA|65|#FFE400|#0055A4
Leganés|LEG|65|#F5F5F5|#0055A4
Málaga|MAL|62|#87CEEB|#FFFFFF
Mirandés|MIR|60|#C8102E|#111111
Racing Santander|RAC|63|#F5F5F5|#00843D
Real Valladolid|VLL|66|#5C2D91|#FFFFFF
Real Zaragoza|ZAR|62|#F5F5F5|#0055A4
Sporting Gijón|SPO|63|#E30613|#FFFFFF
Tenerife|TEN|60|#F5F5F5|#0055A4` },
  { id: "GER1", country: "Germany", nat: "GER", name: "Bundesliga", tier: 1, money: 0.58, dom: 0.5, down: 2, region: "EU", clubs: `
FC Augsburg|FCA|70|#BA3733|#46714D
Bayer Leverkusen|B04|81|#E32221|#111111
Bayern Munich|FCB|87|#DC052D|#FFFFFF
Borussia Dortmund|BVB|82|#FDE100|#111111
Borussia Mönchengladbach|BMG|72|#F5F5F5|#111111
Eintracht Frankfurt|SGE|78|#E1000F|#111111
SC Freiburg|SCF|74|#F5F5F5|#E2001A
Hamburger SV|HSV|69|#0A3F86|#FFFFFF
1. FC Heidenheim|HEI|67|#E2001A|#003B79
TSG Hoffenheim|TSG|73|#1961B5|#FFFFFF
1. FC Köln|KOE|69|#F5F5F5|#ED1C24
RB Leipzig|RBL|80|#F5F5F5|#DD0741
Mainz 05|M05|72|#C3141E|#FFFFFF
St. Pauli|STP|67|#6F4E37|#FFFFFF
VfB Stuttgart|VFB|78|#F5F5F5|#E32219
Union Berlin|FCU|70|#EB1923|#FFFFFF
Werder Bremen|SVW|72|#1D9053|#FFFFFF
VfL Wolfsburg|WOB|73|#65B32E|#FFFFFF` },
  { id: "GER2", country: "Germany", nat: "GER", name: "2. Bundesliga", tier: 2, money: 0.12, dom: 0.72, up: 2, region: "EU", clubs: `
Arminia Bielefeld|DSC|62|#004E95|#111111
VfL Bochum|BOC|65|#005CA9|#FFFFFF
Eintracht Braunschweig|EBS|60|#FFD700|#002F6C
Darmstadt 98|D98|63|#004E9E|#FFFFFF
Dynamo Dresden|SGD|61|#FDDA24|#111111
Fortuna Düsseldorf|F95|64|#DA251D|#FFFFFF
SV Elversberg|SVE|63|#111111|#FFFFFF
Greuther Fürth|SGF|61|#009B48|#FFFFFF
Hannover 96|H96|64|#C8102E|#111111
Hertha BSC|BSC|65|#005CA9|#FFFFFF
Holstein Kiel|KSV|65|#005CA9|#E2001A
Karlsruher SC|KSC|63|#0055A4|#FFFFFF
1. FC Kaiserslautern|FCK|63|#E2001A|#FFFFFF
1. FC Magdeburg|FCM|62|#0055A4|#FFFFFF
1. FC Nürnberg|FCN|63|#9E1B32|#111111
SC Paderborn|SCP|63|#003D7C|#111111
Preußen Münster|SCM|60|#00843D|#111111
Schalke 04|S04|65|#004D9D|#FFFFFF` },
  { id: "ITA1", country: "Italy", nat: "ITA", name: "Serie A", tier: 1, money: 0.55, dom: 0.42, down: 3, region: "EU", clubs: `
Atalanta|ATA|80|#1E71B8|#111111
Bologna|BOL|77|#A21C26|#1A2F48
Cagliari|CAG|69|#A6192E|#002350
Como|COM|75|#0D3C88|#FFFFFF
Cremonese|CRE|67|#E2001A|#9A9A9A
Fiorentina|FIO|75|#482E92|#FFFFFF
Genoa|GEN|70|#A6192E|#002350
Hellas Verona|VER|68|#002F6C|#FFD100
Inter|INT|86|#0068A8|#111111
Juventus|JUV|83|#F5F5F5|#111111
Lazio|LAZ|77|#87D8F7|#FFFFFF
Lecce|LEC|67|#FFD100|#E2001A
AC Milan|MIL|82|#FB090B|#111111
Napoli|NAP|84|#12A0D7|#FFFFFF
Parma|PAR|69|#FFD100|#0055A4
Pisa|PIS|66|#111111|#0055A4
Roma|ROM|80|#8E1F2F|#F0BC42
Sassuolo|SAS|69|#00A752|#111111
Torino|TOR|72|#8A1E03|#FFFFFF
Udinese|UDI|71|#F5F5F5|#111111` },
  { id: "ITA2", country: "Italy", nat: "ITA", name: "Serie B", tier: 2, money: 0.07, dom: 0.75, up: 3, region: "EU", clubs: `
Avellino|AVE|59|#00843D|#FFFFFF
Bari|BAR|61|#E2001A|#FFFFFF
Carrarese|CAR|58|#FFD100|#0055A4
Catanzaro|CTZ|61|#FFD100|#E2001A
Cesena|CES|61|#F5F5F5|#111111
Empoli|EMP|65|#00579C|#FFFFFF
Frosinone|FRO|62|#FFD100|#0055A4
Juve Stabia|JST|60|#FFD100|#0055A4
Mantova|MAN|59|#E2001A|#FFFFFF
Modena|MOD|62|#FFD100|#0055A4
Monza|MON|65|#E2001A|#FFFFFF
Padova|PAD|59|#F5F5F5|#E2001A
Palermo|PAL|65|#E8A0BF|#111111
Pescara|PES|59|#5EB6E4|#FFFFFF
Reggiana|REG|59|#8A1538|#FFFFFF
Sampdoria|SAM|62|#1B5497|#FFFFFF
Spezia|SPE|63|#F5F5F5|#111111
Südtirol|SUD|59|#E2001A|#FFFFFF
Venezia|VEN|65|#111111|#F28C00
Virtus Entella|ENT|58|#5EB6E4|#FFFFFF` },
  { id: "FRA1", country: "France", nat: "FRA", name: "Ligue 1", tier: 1, money: 0.45, dom: 0.5, down: 2, region: "EU", clubs: `
Angers|ANG|67|#F5F5F5|#111111
Auxerre|AUX|67|#F5F5F5|#0055A4
Brest|BRE|71|#E2001A|#FFFFFF
Le Havre|HAV|66|#5EB6E4|#002F6C
Lens|RCL|75|#FFD100|#E2001A
Lille|LIL|77|#E2001A|#002F6C
Lorient|LOR|66|#F58220|#111111
Lyon|OL|78|#F5F5F5|#0055A4
Marseille|OM|79|#2FAEE0|#FFFFFF
Metz|MET|65|#8A1538|#FFFFFF
Monaco|ASM|79|#E2001A|#FFFFFF
Nantes|NAN|68|#FFD100|#00843D
Nice|NIC|74|#E2001A|#111111
Paris FC|PFC|68|#002F6C|#FFFFFF
Paris Saint-Germain|PSG|88|#004170|#DA291C
Rennes|REN|73|#E2001A|#111111
Strasbourg|RCS|74|#0055A4|#FFFFFF
Toulouse|TFC|70|#5B2C86|#FFFFFF` },
  { id: "FRA2", country: "France", nat: "FRA", name: "Ligue 2", tier: 2, money: 0.06, dom: 0.72, up: 2, region: "EU", clubs: `
Amiens|AMI|60|#F5F5F5|#111111
Annecy|ANN|59|#E2001A|#FFFFFF
Bastia|BAS|59|#0055A4|#FFFFFF
Boulogne|BOU|56|#E2001A|#111111
Clermont|CLE|61|#E2001A|#0055A4
Dunkerque|DUN|60|#0055A4|#FFFFFF
Grenoble|GRE|59|#0055A4|#FFFFFF
Guingamp|GUI|60|#E2001A|#111111
Laval|LAV|58|#F58220|#111111
Le Mans|LMA|58|#E2001A|#FFD100
Montpellier|MHS|64|#002F6C|#F58220
Nancy|NAN|58|#F5F5F5|#E2001A
Pau|PAU|59|#FFD100|#0055A4
Red Star|RSF|59|#00843D|#FFFFFF
Reims|REI|65|#E2001A|#FFFFFF
Rodez|ROD|59|#E2001A|#FFD100
Saint-Étienne|STE|66|#00843D|#FFFFFF
Troyes|TRO|61|#0055A4|#FFFFFF` },
  { id: "NED1", country: "Netherlands", nat: "NED", name: "Eredivisie", tier: 1, money: 0.15, dom: 0.55, region: "EU", clubs: `
Ajax|AJA|76|#F5F5F5|#D2122E
AZ Alkmaar|AZ|73|#E2001A|#FFFFFF
Excelsior|EXC|61|#E2001A|#111111
Feyenoord|FEY|76|#E2001A|#FFFFFF
Fortuna Sittard|FOR|63|#FFD100|#00843D
Go Ahead Eagles|GAE|65|#E2001A|#FFD100
Groningen|GRO|64|#00843D|#FFFFFF
Heerenveen|HEE|64|#0055A4|#FFFFFF
Heracles|HER|62|#F5F5F5|#111111
NAC Breda|NAC|62|#FFD100|#111111
NEC Nijmegen|NEC|66|#E2001A|#00843D
PEC Zwolle|PEC|62|#0055A4|#FFFFFF
PSV|PSV|78|#E2001A|#FFFFFF
Sparta Rotterdam|SPA|62|#E2001A|#FFFFFF
Telstar|TEL|58|#F5F5F5|#E2001A
FC Twente|TWE|70|#E2001A|#FFFFFF
FC Utrecht|UTR|68|#E2001A|#FFFFFF
FC Volendam|VOL|59|#F58220|#FFFFFF` },
  { id: "POR1", country: "Portugal", nat: "POR", name: "Primeira Liga", tier: 1, money: 0.15, dom: 0.45, region: "EU", clubs: `
Alverca|ALV|60|#E2001A|#FFFFFF
Arouca|ARO|63|#FFD100|#0055A4
AVS|AVS|60|#E2001A|#FFFFFF
Benfica|SLB|79|#E2001A|#FFFFFF
Braga|SCB|74|#E2001A|#FFFFFF
Casa Pia|CPA|62|#111111|#FFFFFF
Estoril|EST|63|#FFD100|#0055A4
Estrela Amadora|EAM|61|#E2001A|#00843D
Famalicão|FAM|65|#0055A4|#FFFFFF
Gil Vicente|GIL|64|#E2001A|#0055A4
Moreirense|MOR|62|#00843D|#FFFFFF
Nacional|NAC|60|#111111|#FFFFFF
Porto|FCP|79|#0055A4|#FFFFFF
Rio Ave|RIO|62|#00843D|#FFFFFF
Santa Clara|SCL|63|#E2001A|#FFFFFF
Sporting CP|SCP|80|#008057|#FFFFFF
Tondela|TON|59|#FFD100|#00843D
Vitória SC|VSC|66|#F5F5F5|#111111` },
  { id: "TUR1", country: "Turkey", nat: "TUR", name: "Süper Lig", tier: 1, money: 0.2, dom: 0.5, region: "EU", clubs: `
Alanyaspor|ALA|65|#F58220|#00843D
Antalyaspor|ANT|63|#E2001A|#FFFFFF
Başakşehir|IBF|67|#F58220|#002F6C
Beşiktaş|BJK|75|#111111|#FFFFFF
Eyüpspor|EYP|62|#5B2C86|#FFD100
Fatih Karagümrük|FKG|61|#E2001A|#111111
Fenerbahçe|FB|78|#FFD100|#002F6C
Galatasaray|GS|79|#A90432|#FDB912
Gaziantep|GFK|62|#E2001A|#111111
Gençlerbirliği|GB|60|#E2001A|#111111
Göztepe|GOZ|64|#FFD100|#E2001A
Kasımpaşa|KAS|62|#0055A4|#FFFFFF
Kayserispor|KAY|61|#FFD100|#E2001A
Kocaelispor|KOC|61|#00843D|#111111
Konyaspor|KON|62|#00843D|#FFFFFF
Rizespor|RIZ|62|#00843D|#0055A4
Samsunspor|SAM|65|#E2001A|#FFFFFF
Trabzonspor|TS|72|#8A1538|#5EB6E4` },
  { id: "SCO1", country: "Scotland", nat: "SCO", name: "Scottish Premiership", tier: 1, money: 0.08, dom: 0.55, region: "EU", clubs: `
Aberdeen|ABE|64|#E2001A|#FFFFFF
Celtic|CEL|75|#018749|#FFFFFF
Dundee|DUN|58|#002F6C|#FFFFFF
Dundee United|DUU|60|#F58220|#111111
Falkirk|FAL|57|#002F6C|#FFFFFF
Hearts|HEA|64|#8A1538|#FFFFFF
Hibernian|HIB|63|#00843D|#FFFFFF
Kilmarnock|KIL|59|#0055A4|#FFFFFF
Livingston|LIV|57|#FFD100|#111111
Motherwell|MOT|60|#F59E00|#8A1538
Rangers|RAN|73|#1B458F|#FFFFFF
St Mirren|STM|59|#111111|#FFFFFF` },
  { id: "BEL1", country: "Belgium", nat: "BEL", name: "Belgian Pro League", tier: 1, money: 0.1, dom: 0.45, region: "EU", clubs: `
Anderlecht|AND|71|#5B2C86|#FFFFFF
Antwerp|ANT|67|#E2001A|#FFFFFF
Cercle Brugge|CER|63|#00843D|#111111
Charleroi|CHA|64|#111111|#FFFFFF
Club Brugge|CLU|76|#0055A4|#111111
Dender|DEN|59|#0055A4|#FFFFFF
Genk|GNK|71|#0055A4|#FFFFFF
Gent|GNT|69|#0055A4|#FFFFFF
La Louvière|LAL|58|#00843D|#FFFFFF
Mechelen|MEC|64|#FFD100|#E2001A
OH Leuven|OHL|62|#F5F5F5|#E2001A
Sint-Truiden|STV|62|#FFD100|#0055A4
Standard Liège|STA|66|#E2001A|#FFFFFF
Union SG|USG|73|#FFD100|#0055A4
Westerlo|WES|63|#FFD100|#0055A4
Zulte Waregem|ZWA|61|#E2001A|#00843D` },
  { id: "EGY1", country: "Egypt", nat: "EGY", name: "Egyptian Premier League", tier: 1, money: 0.04, dom: 0.9, region: "AF", clubs: `
Al Ahly|AHL|73|#E2001A|#FFFFFF
Zamalek|ZAM|69|#F5F5F5|#E2001A
Pyramids FC|PYR|70|#0A2342|#5EB6E4
Al Masry|MAS|63|#00843D|#FFFFFF
Modern Sport|MOD|60|#111111|#FFD100
ENPPI|ENP|60|#E2001A|#0055A4
Ismaily|ISM|59|#FFD100|#0055A4
Al Ittihad Alexandria|ITT|60|#00843D|#FFFFFF
Smouha|SMO|60|#0055A4|#FFFFFF
Ceramica Cleopatra|CER|62|#5B2C86|#FFFFFF
Petrojet|PET|58|#FFD100|#0055A4
Talaea El Gaish|TEG|58|#E2001A|#FFD100
National Bank of Egypt|NBE|60|#0055A4|#FFFFFF
ZED FC|ZED|61|#111111|#F58220
El Gouna|GOU|58|#0055A4|#FFFFFF
Ghazl El Mahalla|GHA|57|#FFD100|#0055A4
Pharco|PHA|58|#E2001A|#FFFFFF
Haras El Hodoud|HAR|56|#00843D|#FFD100` },
  { id: "MAR1", country: "Morocco", nat: "MAR", name: "Botola Pro", tier: 1, money: 0.035, dom: 0.88, region: "AF", clubs: `
Wydad AC|WAC|67|#E2001A|#FFFFFF
Raja CA|RCA|66|#00843D|#FFFFFF
AS FAR|FAR|66|#111111|#E2001A
RS Berkane|RSB|67|#F58220|#111111
FUS Rabat|FUS|62|#E2001A|#FFFFFF
Maghreb Fès|MAS|60|#FFD100|#111111
Hassania Agadir|HUS|59|#E2001A|#FFD100
IR Tanger|IRT|60|#0055A4|#FFFFFF
Olympic Safi|OCS|59|#0055A4|#FFFFFF
Difaâ El Jadidi|DHJ|58|#00843D|#E2001A
Moghreb Tétouan|MAT|58|#E2001A|#FFFFFF
Union Touarga|UTS|58|#5EB6E4|#FFFFFF
CODM Meknès|COD|57|#E2001A|#00843D
Kawkab Marrakech|KAC|58|#E2001A|#FFFFFF
Renaissance Zemamra|RCZ|57|#00843D|#FFFFFF
Olympique Dcheira|OD|56|#5EB6E4|#111111` },
  { id: "RSA1", country: "South Africa", nat: "RSA", name: "Betway Premiership", tier: 1, money: 0.035, dom: 0.85, region: "AF", clubs: `
Mamelodi Sundowns|SUN|71|#FFD100|#00843D
Orlando Pirates|PIR|67|#111111|#FFFFFF
Kaizer Chiefs|KC|63|#FFD100|#111111
Stellenbosch|STE|62|#8A1538|#FFFFFF
AmaZulu|AMA|60|#00843D|#FFFFFF
Golden Arrows|GAR|58|#00843D|#FFD100
Sekhukhune United|SEK|60|#0055A4|#FFD100
TS Galaxy|TSG|59|#E2001A|#FFFFFF
Polokwane City|POL|57|#0055A4|#FFD100
Chippa United|CHI|57|#0055A4|#FFFFFF
Richards Bay|RIC|57|#0055A4|#FFFFFF
Marumo Gallants|MAR|56|#FFD100|#5B2C86
Magesi|MAG|55|#E2001A|#FFFFFF
Orbit College|ORB|54|#F58220|#0055A4
Durban City|DUR|56|#5EB6E4|#111111
Siwelele|SIW|58|#E2001A|#0055A4` },
  { id: "TUN1", country: "Tunisia", nat: "TUN", name: "Ligue Professionnelle 1", tier: 1, money: 0.025, dom: 0.88, region: "AF", clubs: `
Espérance de Tunis|EST|66|#E2001A|#FFD100
Étoile du Sahel|ESS|62|#E2001A|#FFFFFF
Club Africain|CA|62|#E2001A|#FFFFFF
CS Sfaxien|CSS|61|#111111|#FFFFFF
US Monastir|USM|60|#0055A4|#FFFFFF
Stade Tunisien|ST|58|#E2001A|#00843D
CA Bizertin|CAB|57|#111111|#FFD100
US Ben Guerdane|USBG|57|#0055A4|#E2001A
AS Marsa|ASM|56|#FFD100|#E2001A
ES Métlaoui|ESM|55|#FFD100|#0055A4
JS Omrane|JSO|55|#00843D|#FFFFFF
Olympique Béja|OB|56|#E2001A|#111111
AS Soliman|ASS|55|#E2001A|#00843D
ES Zarzis|ESZ|56|#0055A4|#FFFFFF
JS Kairouan|JSK|55|#0055A4|#FFFFFF
CS Hammam-Lif|CSHL|55|#00843D|#FFFFFF` },
  { id: "ALG1", country: "Algeria", nat: "ALG", name: "Ligue Professionnelle 1", tier: 1, money: 0.025, dom: 0.9, region: "AF", clubs: `
CR Belouizdad|CRB|63|#E2001A|#FFFFFF
MC Alger|MCA|64|#00843D|#E2001A
JS Kabylie|JSK|62|#FFD100|#00843D
USM Alger|USMA|63|#E2001A|#111111
CS Constantine|CSC|61|#00843D|#111111
ES Sétif|ESS|61|#111111|#FFFFFF
MC Oran|MCO|59|#E2001A|#FFFFFF
Paradou AC|PAC|59|#FFD100|#0055A4
ASO Chlef|ASO|58|#E2001A|#FFFFFF
JS Saoura|JSS|59|#FFD100|#00843D
USM Khenchela|USMK|56|#0055A4|#FFFFFF
Olympique Akbou|OA|57|#00843D|#FFFFFF
MC El Bayadh|MCEB|56|#00843D|#FFFFFF
ES Mostaganem|ESM|55|#00843D|#FFFFFF
MB Rouissat|MBR|55|#0055A4|#FFFFFF
ES Ben Aknoun|ESBA|55|#0055A4|#E2001A` },
];

// Continental slots allocated by domestic finishing position.
const EURO_SLOTS = {
  UCL: { ENG1: 5, ESP1: 5, ITA1: 5, GER1: 5, FRA1: 4, NED1: 3, POR1: 3, TUR1: 2, BEL1: 2, SCO1: 2 },
  UEL: { ENG1: 3, ESP1: 3, ITA1: 3, GER1: 3, FRA1: 3, NED1: 3, POR1: 4, TUR1: 5, BEL1: 5, SCO1: 4 },
  CAFCL: { EGY1: 4, MAR1: 4, RSA1: 3, TUN1: 3, ALG1: 2 },
  CAFCC: { EGY1: 4, MAR1: 4, RSA1: 3, TUN1: 2, ALG1: 3 },
};

const COMP_INFO = {
  UCL: { name: "Champions League", short: "UCL", region: "EU", prize: 18e6, win: 2.1e6 },
  UEL: { name: "Europa League", short: "UEL", region: "EU", prize: 4.3e6, win: 0.45e6 },
  CAFCL: { name: "CAF Champions League", short: "CAF CL", region: "AF", prize: 0.7e6, win: 0.08e6 },
  CAFCC: { name: "CAF Confederation Cup", short: "CAF CC", region: "AF", prize: 0.3e6, win: 0.04e6 },
};

const CUP_NAMES = { England: "FA Cup", Spain: "Copa del Rey", Germany: "DFB-Pokal", Italy: "Coppa Italia", France: "Coupe de France", Netherlands: "KNVB Cup", Portugal: "Taça de Portugal", Turkey: "Turkish Cup", Scotland: "Scottish Cup", Belgium: "Belgian Cup", Egypt: "Egypt Cup", Morocco: "Throne Cup", "South Africa": "Nedbank Cup", Tunisia: "Tunisian Cup", Algeria: "Algerian Cup" };

// Name pools
const POOLS = {
  eng: {
    f: "Harry Jack James Oliver George Charlie Thomas Jacob Alfie Joe Callum Mason Declan Jordan Kyle Reece Jude Marcus Phil Cole Aaron Ben Conor Lewis Ollie Tyler Ethan Luke Sam Dan Kieran Jarrod Morgan Ezri Levi Curtis Rico Archie Freddie Noah Max Josh Liam Ryan Harvey Elliot Jamie Tom",
    l: "Smith Jones Taylor Brown Williams Wilson Johnson Davies Robinson Wright Thompson Evans Walker White Roberts Green Hall Wood Jackson Clarke Hughes Edwards Turner Hill Moore Cooper Ward Morris King Watson Harrison Morgan Baker Lewis Phillips Mason Barnes Mitchell Kelly Shaw Palmer Gibbs Bennett Carter Dixon Fletcher Holt Lowe Marsh Pope Quinn Reed Stone Tierney Whitaker Ashworth Bramall Colwill Doak",
  },
  sco: {
    f: "Callum Lewis Ryan Scott Kieran Andrew Lyndon Billy Ross Craig Grant Stuart Liam Jamie Connor Lennon Ewan Fraser Euan Calum Kyle Aaron Nathan",
    l: "McGregor Robertson Campbell Stewart Murray Paterson McLean Fraser Ferguson MacDonald Reid Ross Gilmour McKenna Christie Hendry Burke Ralston Hanley Taylor Porteous Shankland Adams Armstrong Doig Patterson Kingsley Cameron Hamilton Barron",
  },
  esp: {
    f: "Pablo Álvaro Sergio Daniel Alejandro Javier Carlos David Mario Adrián Iker Unai Mikel Raúl Rodrigo Pedro Marcos Diego Jorge Hugo Martín Lucas Gonzalo Nico Fermín Pau Aitor Óscar Íñigo Dani Víctor Rubén Borja Jesús Fran Samu Aleix Eric Hugo Joan Marc Gerard Oriol",
    l: "García Fernández González Rodríguez López Martínez Sánchez Pérez Gómez Martín Jiménez Ruiz Hernández Díaz Moreno Muñoz Álvarez Romero Alonso Gutiérrez Navarro Torres Domínguez Vázquez Ramos Gil Serrano Blanco Molina Morales Ortega Delgado Castro Ortiz Rubio Marín Sanz Iglesias Medina Garrido Cortés Castillo Santos Lozano Guerrero Cano Prieto Méndez Calvo Cruz Gallego Vidal León Herrera Peña Etxeberria Aguirre Arrieta Zabala Larrea Puig Casadó Bernal",
  },
  ger: {
    f: "Lukas Leon Jonas Niklas Tim Felix Maximilian Florian Kai Jamal Julian Leroy Marc Kevin Paul David Robin Jan Nico Moritz Tom Luca Finn Ben Elias Noah Yannik Dennis Sebastian Benjamin Mats Joshua Karim Aleksandar Angelo Tobias Lennart Jannik Silas Merlin",
    l: "Müller Schmidt Schneider Fischer Weber Meyer Wagner Becker Schulz Hoffmann Koch Richter Klein Wolf Schröder Neumann Schwarz Braun Zimmermann Krüger Hofmann Hartmann Lange Werner Krause Lehmann Köhler Maier Walter König Kaiser Fuchs Peters Vogel Jung Keller Frank Berger Roth Beck Lorenz Baumann Franke Albrecht Winkler Brandt Kühn Pohl Engel Horn Busch Bergmann Voigt Sauer Arnold Ziegler Ludwig Böhm Kraus Stach Mittelstädt",
  },
  ita: {
    f: "Lorenzo Federico Alessandro Matteo Davide Andrea Marco Nicolò Gianluca Giacomo Riccardo Francesco Simone Stefano Luca Manuel Mattia Sandro Giorgio Leonardo Pietro Tommaso Gabriele Alessio Samuele Raoul Fabio Daniele Ciro Domenico Salvatore Emanuele Michele Edoardo Filippo",
    l: "Rossi Russo Ferrari Esposito Bianchi Romano Colombo Ricci Marino Greco Bruno Gallo Conti De_Luca Mancini Costa Giordano Rizzo Lombardi Moretti Barbieri Fontana Santoro Mariani Rinaldi Caruso Ferrara Galli Martini Leone Longo Gentile Martinelli Vitale Lombardo Serra Coppola De_Santis D'Angelo Marchetti Parisi Villa Ferri Fabbri Bellini Pellegrini Palumbo Sanna Fumagalli Scalvini Cambiaso Ricci Udogie Frattesi",
  },
  fra: {
    f: "Lucas Hugo Théo Antoine Kylian Ousmane Aurélien Eduardo Jules Benjamin Adrien Mathys Rayan Warren Bradley Randal Dayot Ibrahima Moussa Mamadou Youssouf Kingsley Florian Maxence Enzo Nathan Clément Romain Thomas Mathis Désiré Malo Tanguy Lenny Wesley Jonathan Yann Loïc Corentin Axel Kevin Lilian Bafodé Mathys Wilson",
    l: "Martin Bernard Dubois Thomas Robert Richard Petit Durand Leroy Moreau Simon Laurent Lefebvre Michel Garcia David Bertrand Roux Vincent Fournier Morel Girard André Lefèvre Mercier Dupont Lambert Bonnet François Legrand Garnier Faure Rousseau Blanc Guérin Henry Roussel Nicolas Perrin Morin Mathieu Clément Gauthier Diallo Traoré Koné Camara Sissoko Mendy Diaby Konaté Kamara Touré Doucouré Cissé Fofana Zaïre Mbemba Akliouche Ekitike Kalimuendo",
  },
  ned: {
    f: "Daan Sem Lars Bram Thijs Jesse Ruben Kenneth Teun Joey Jurriën Xavi Ryan Micky Tijjani Jeremie Quinten Justin Wout Stefan Bart Sven Luuk Milan Jorrel Brian Mats Devyne Denzel Calvin Jerdy Crysencio Quilindschy Jorthy Ian Kees",
    l: "de_Jong Jansen de_Vries van_den_Berg Bakker Visser Smit Meijer de_Boer Mulder de_Groot Bos Vos Peters Hendriks van_Leeuwen Dekker Brouwer de_Wit Dijkstra Smits de_Graaf van_der_Meer van_der_Linden Kok Jacobs de_Haan Vermeulen van_den_Heuvel van_der_Veen Martha Wieffer Til Veerman Bijlow Flamingo Hato Gravenberch Schouten",
  },
  por: {
    f: "João Rúben Diogo Bernardo Rafael Gonçalo Pedro Francisco Tiago André Nuno Renato Bruno Ricardo Rodrigo Tomás Miguel Gustavo Fábio Hugo Nélson Samuel Afonso Duarte Martim Henrique Geovany Vasco Zeno Quaresma",
    l: "Silva Santos Ferreira Pereira Oliveira Costa Rodrigues Martins Jesus Sousa Fernandes Gonçalves Gomes Lopes Marques Alves Almeida Ribeiro Pinto Carvalho Teixeira Moreira Correia Mendes Nunes Soares Vieira Monteiro Cardoso Rocha Neves Coelho Cruz Cunha Pires Ramos Reis Simões Antunes Matos Fonseca Morais Inácio Dalot Trincão",
  },
  tur: {
    f: "Arda Kerem Hakan Mert Orkun Ferdi Cengiz Kaan Barış Yusuf Emre Okay Abdülkerim Zeki Uğurcan Altay Semih Kenan İrfan Salih Oğuz Halil Burak Cenk Ozan Taylan Umut Yunus Eren Can Onur Serdar Berkan Ahmet Mehmet Mustafa Samet",
    l: "Yılmaz Kaya Demir Şahin Çelik Yıldız Yıldırım Öztürk Aydın Özdemir Arslan Doğan Kılıç Aslan Çetin Kara Koç Kurt Özkan Şimşek Polat Erdoğan Ünal Akgün Bayındır Kökçü Güler Akbaba Kahveci Tosun Uzun Ayhan Söyüncü Bardakcı Akaydın Elmalı Kabak Yazıcı",
  },
  egy: {
    f: "Mohamed Ahmed Mahmoud Omar Mostafa Karim Amr Hossam Tarek Ali Ibrahim Youssef Emam Hamdi Akram Marwan Ramadan Taher Hussein Abdallah Islam Nasser Ayman Walid Sherif Hany Khaled Ziad Saber Osama Mohanad Hazem Shady Zizo",
    l: "El_Sayed Abdel_Moneim Gaber Shehata Fathy Kamal Hamed Ramadan Soliman Mansour Nabil Samir Adel Ezzat Hosny Zaki Lotfy Rabia Afsha Attia Hamdy Mohsen Gamal Saad Farouk Tawfik El_Gabry Abou_Ali Hafez Ragab Shokry Zidan El_Sharkawy Osman Morsy Barakat Hassan Abdelaziz Said Fawzy Ashour Hegazy",
  },
  mag: {
    f: "Achraf Hakim Youssef Sofyan Azzedine Nayef Bilal Yassine Ilias Abde Amine Noussair Sofiane Riyad Ismaël Ramy Saïd Houssem Aïssa Hicham Mehdi Anis Ayoub Zakaria Anass Oussama Hamza Walid Adam Rayan Brahim Nabil Elias Montassar Wahbi Ali Seifeddine Firas Aymen Yahia Islam Rafik",
    l: "Benali Bouzid Haddad Mansouri Cherif Belkacem Boudiaf Hamdi Saidi Trabelsi Jaziri Khazri Msakni Laïdouni Skhiri Talbi Abdi Rahmani Lahmar Brahimi Benyahia Zerrouki Mokrani Chaker Khelifi El_Idrissi Benjelloun Alaoui Tazi Fassi Berrada Chraibi El_Amrani Bennani Ouazzani Kabbaj Lamrani Zouhri Naciri Rahimi Aguerd Ezzalzouli Belaïli Ounahi Zalzouli Harit Gouiri Amoura Chaïbi Bentaleb",
  },
  rsa: {
    f: "Thabo Sipho Themba Lebo Teboho Percy Ronwen Mothobi Siyabonga Thapelo Bongani Khuliso Aubrey Evidence Relebohile Oswin Grant Mihlali Iqraam Elias Thembinkosi Lyle Tshegofatso Sphephelo Njabulo Kamogelo Sibusiso Mduduzi Neo Katlego Lungelo Bradley",
    l: "Mokoena Zwane Nkosi Dlamini Ndlovu Khumalo Mthembu Sithole Mahlangu Mabaso Shabalala Modiba Mudau Lepasa Maseko Ngcobo Zulu Cele Mkhize Buthelezi Molefe Mofokeng Masilela Radebe Tau Foster Williams Appollis Adams Hendricks Mvala Kekana Mbatha Mahlambi Mailula Sibisi Makgopa Rayners",
  },
  waf: {
    f: "Moussa Ismaïla Idrissa Cheikh Pape Sadio Kalidou Edouard Krépin Nicolas Habib Abdou Lamine Iliman Nampalys Boulaye Mamadou Amadou Yves Franck Sébastien Serge Wilfried Jean-Philippe Simon Odilon Seko Karl André-Frank Bryan Christian Vincent Eric Samuel Ibrahim Souleymane Ousmane Oumar Boubacar Adama Yaya Salif Bakary Lassine Habib Pathé",
    l: "Diop Ndiaye Sarr Gueye Mendy Koulibaly Diatta Sow Fall Faye Ba Diallo Ciss Dieng Niang Thiam Seck Mbaye Diouf Touré Kessié Koné Bamba Sangaré Fofana Doumbia Coulibaly Traoré Keïta Diarra Konaté Sissoko Camara Dembélé Samassékou Haïdara Bissouma Aboubakar Mbeumo Anguissa Onana Ekambi Toko Nkoulou Ngadeu Mbia Tchami Ngamaleu Moukoko Ebosse Kunde Jakobs Sangaré Gnonto",
  },
  ngh: {
    f: "Victor Samuel Wilfred Alex Kelechi Ademola Moses Calvin Frank Joe Ola Taiwo Bright Chidera Tolu Emmanuel Semi Raphael Fisayo Abdul Thomas Mohammed Jordan Antoine Kamaldeen Daniel Osman Ernest Jeffrey Christopher Felix Kwame Kofi Kojo Yaw Kwabena Chukwuemeka Tochukwu",
    l: "Okafor Okonkwo Eze Nwankwo Adeyemi Ndidi Iheanacho Chukwueze Aribo Onyeka Ajayi Balogun Bassey Ekong Akinwale Ogunleye Olayinka Obi Uzoho Nwabali Onuachu Simon Mensah Owusu Boateng Asamoah Ayew Partey Sulemana Semenyo Lamptey Djiku Salisu Amartey Ofori Acheampong Appiah Agyemang Opoku Gyan Adjei Danso Annan Quaye Tetteh Fatawu Nuamah Iwobi",
  },
  bra: {
    f: "Gabriel Lucas Matheus Vinícius Rodrygo Bruno Raphael Endrick Éder Danilo Alex Douglas Thiago André Igor Wendell Murilo Rafael João Pedro Gerson Everton Savinho Estêvão Luiz Fabinho Gleison Arthur Felipe Renan Caio Kaio Wesley Yan Léo Paulinho Weverton Bento Vitor Luan Igor Kauã Gustavo",
    l: "Silva Santos Oliveira Souza Lima Pereira Costa Ferreira Rodrigues Almeida Nascimento Alves Carvalho Araújo Ribeiro Gomes Martins Rocha Barbosa Cardoso Melo Teixeira Moura Dias Freitas Nunes Pinto Batista Correia Machado Fernandes Vieira Monteiro Andrade Cavalcanti Mendes Azevedo Castro Campos Moreira Paquetá Guimarães Magalhães Henrique",
  },
  lat: {
    f: "Lautaro Julián Enzo Alexis Rodrigo Nicolás Lisandro Cristian Nahuel Leandro Giovani Thiago Valentín Facundo Franco Matías Santiago Gonzalo Exequiel Ángel Paulo Emiliano Gerónimo Agustín Federico Darwin Ronald Manuel Mathías José Luis Jhon Juan Yerry Davinson Daniel Richard Jefferson Kevin Andrés Maximiliano",
    l: "Martínez Álvarez Fernández González Rodríguez Romero Acuña Molina Tagliafico Otamendi Paredes Lo_Celso Correa Almada Pérez Sosa Gómez Díaz Benítez Medina Torres Núñez Bentancur Araújo Giménez Olivera Ugarte Pellistri Cáceres Muriel Sánchez Mina Arias Lerma Borré Quintero Carrascal Castaño Ríos Muñoz Herrera Ospina Vargas Castro Ramírez Hernández Ruiz Palacios Villalba Barco Echeverri Soulé Mastantuono",
  },
  sca: {
    f: "Rasmus Christian Kasper Andreas Joachim Mikkel Jonas Morten Mathias Jesper Martin Alexander Sander Kristoffer Leo Oscar Viktor Emil Gustav Anton Isak Hugo Elias Lucas William Felix Magnus Fredrik Ola Jørgen Sindre Patrick Oskar Albert Conrad",
    l: "Hansen Jensen Nielsen Pedersen Andersen Christensen Larsen Sørensen Rasmussen Jørgensen Olsen Johansen Berg Haugen Strand Eriksen Lindqvist Johansson Andersson Karlsson Nilsson Eriksson Larsson Olsson Persson Svensson Gustafsson Lindgren Holm Ekdal Thorsby Sørloth Nusa Damsgaard Wind Bah Kristiansen Skov Dorgu Bobb Elanga Gyökeres Ajer Wolfe",
  },
  sla: {
    f: "Luka Ivan Mateo Josip Marcelo Andrej Dušan Aleksandar Sergej Filip Nikola Lovro Martin Borna Mario Duje Petar Marko Stefan Strahinja Nemanja Lazar Robert Piotr Jakub Kamil Wojciech Bartosz Przemysław Sebastian Krzysztof Jan Mateusz Karol Dominik Michał",
    l: "Kovačić Perišić Brozović Kramarić Pašalić Šutalo Stanišić Vlašić Majer Sučić Baturina Livaković Petković Budimir Mitrović Lukić Pavlović Živković Gudelj Kostić Jović Milenković Babić Vušković Zieliński Bednarek Kiwior Cash Frankowski Świderski Piątek Moder Kamiński Nowak Kowalski Wiśniewski Wójcik Kowalczyk Zając Krawczyk Horvat Novak Kovač Marić Jurić Knežević Pavić Božić Grgić Vuković Popović Nikolić Ilić Đorđević Stojanović Marković Petrović Jovanović",
  },
  jpn: {
    f: "Takumi Kaoru Takefusa Wataru Daichi Ritsu Junya Hidemasa Ko Ayase Takehiro Hiroki Yukinari Zion Daizen Kyogo Reo Keito Shuto Koki Yuto Sota Haruto Ren Kaito Yuma Kota Yuki",
    l: "Sato Suzuki Takahashi Tanaka Watanabe Ito Yamamoto Nakamura Kobayashi Kato Yoshida Yamada Sasaki Yamaguchi Matsumoto Inoue Kimura Hayashi Shimizu Endo Doan Minamino Tomiyasu Itakura Maeda Ueda Morita Machida Hatate Furuhashi Asano Kamada Nakata Ogawa Suzuki Sano",
  },
  kor: {
    f: "Min-jae Kang-in Hee-chan Jae-sung Gue-sung Woo-yeong In-beom Seung-ho Young-woo Jun-ho Ji-sung Hyun-woo Dong-gyeong Jin-su Tae-hwan Chang-hoon Sang-ho Min-kyu Do-hyeon Ji-hoon Jun-seo Hyeon-gyu",
    l: "Kim Lee Park Choi Jung Kang Cho Yoon Jang Lim Han Oh Seo Shin Kwon Hwang Ahn Song Hong Jeon Bae Paik Seol Yang",
  },
  usa: {
    f: "Christian Weston Tyler Sergiño Antonee Gio Folarin Ricardo Brenden Malik Matt Zack Tim Josh Haji Johnny Yunus Cameron Chris Miles Joe Diego Paxten Caden Tanner Aidan Brandon Jordan Cade Kristian",
    l: "McKennie Adams Dest Robinson Reyna Balogun Pepi Aaronson Tillman Turner Steffen Weah Sargent Wright Cardoso Musah Richards Ream Scally Zendejas Agyemang Johnson Miller Davis Anderson Taylor Thomas Moore Martin Clark Lewis Walker Young Allen Scott Green Baker Freeman Berhalter",
  },
};

// Nations: code -> [name, pool, skin weights light/medium/dark, region]
const NATIONS = {
  ENG: ["England", "eng", [0.66, 0.12, 0.22]], SCO: ["Scotland", "sco", [0.9, 0.05, 0.05]],
  ESP: ["Spain", "esp", [0.72, 0.23, 0.05]], GER: ["Germany", "ger", [0.72, 0.14, 0.14]],
  ITA: ["Italy", "ita", [0.8, 0.16, 0.04]], FRA: ["France", "fra", [0.45, 0.15, 0.4]],
  NED: ["Netherlands", "ned", [0.62, 0.1, 0.28]], POR: ["Portugal", "por", [0.6, 0.25, 0.15]],
  TUR: ["Turkey", "tur", [0.3, 0.7, 0]], BEL: ["Belgium", "fra", [0.6, 0.1, 0.3]],
  EGY: ["Egypt", "egy", [0.05, 0.85, 0.1]], MAR: ["Morocco", "mag", [0.15, 0.8, 0.05]],
  TUN: ["Tunisia", "mag", [0.15, 0.8, 0.05]], ALG: ["Algeria", "mag", [0.15, 0.8, 0.05]],
  RSA: ["South Africa", "rsa", [0.06, 0.1, 0.84]], SEN: ["Senegal", "waf", [0, 0.03, 0.97]],
  CIV: ["Ivory Coast", "waf", [0, 0.03, 0.97]], MLI: ["Mali", "waf", [0, 0.03, 0.97]],
  CMR: ["Cameroon", "waf", [0, 0.03, 0.97]], NGA: ["Nigeria", "ngh", [0, 0.02, 0.98]],
  GHA: ["Ghana", "ngh", [0, 0.02, 0.98]], BRA: ["Brazil", "bra", [0.35, 0.35, 0.3]],
  ARG: ["Argentina", "lat", [0.75, 0.25, 0]], URU: ["Uruguay", "lat", [0.75, 0.2, 0.05]],
  COL: ["Colombia", "lat", [0.25, 0.45, 0.3]], DEN: ["Denmark", "sca", [0.88, 0.04, 0.08]],
  NOR: ["Norway", "sca", [0.88, 0.04, 0.08]], SWE: ["Sweden", "sca", [0.8, 0.08, 0.12]],
  CRO: ["Croatia", "sla", [0.97, 0.03, 0]], SRB: ["Serbia", "sla", [0.97, 0.03, 0]],
  POL: ["Poland", "sla", [0.97, 0.03, 0]], JPN: ["Japan", "jpn", "asian"],
  KOR: ["South Korea", "kor", "asian"], USA: ["United States", "usa", [0.5, 0.2, 0.3]],
  AUT: ["Austria", "ger", [0.85, 0.1, 0.05]], SUI: ["Switzerland", "ger", [0.75, 0.12, 0.13]],
};

const FOREIGN_EU = "BRA:8 FRA:8 ESP:5 POR:5 ARG:6 NED:4 GER:4 BEL:3 SEN:4 CIV:4 NGA:4 GHA:3 CMR:3 MAR:4 ALG:2 CRO:3 SRB:3 DEN:3 NOR:2 SWE:2 POL:3 URU:3 COL:3 USA:2 JPN:3 KOR:2 MLI:2 AUT:2 SUI:2 ENG:4 ITA:2 TUR:1 EGY:1 SCO:1 TUN:1";
const FOREIGN_AF = "CIV:4 NGA:4 GHA:4 MLI:4 SEN:3 CMR:4 MAR:2 TUN:2 ALG:2 EGY:2 RSA:2 BRA:1";

const SKIN = ["#f6d7bf", "#ebbf9c", "#d9a57d", "#c08a5f", "#9a6643", "#6f452c", "#4a2d1c"];
const HAIR_COLORS = { black: "#1b1612", dark: "#3a271b", brown: "#6a4428", light: "#a0703f", blond: "#d8b166", red: "#a2492a", grey: "#9a9a96" };

const POSITIONS = ["GK", "CB", "LB", "RB", "DM", "CM", "AM", "LW", "RW", "ST"];
const POS_GROUP = { GK: "GK", CB: "DEF", LB: "DEF", RB: "DEF", DM: "MID", CM: "MID", AM: "MID", LW: "ATT", RW: "ATT", ST: "ATT" };
const ATTRS = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY", "GK"];
// Weights for overall per position over [pac,sho,pas,dri,def,phy,gk]
const POS_W = {
  GK: [0, 0, 0.05, 0, 0, 0.05, 0.9],
  CB: [0.1, 0, 0.1, 0.05, 0.5, 0.25, 0],
  LB: [0.3, 0, 0.2, 0.1, 0.35, 0.05, 0],
  RB: [0.3, 0, 0.2, 0.1, 0.35, 0.05, 0],
  DM: [0.05, 0, 0.3, 0.1, 0.35, 0.2, 0],
  CM: [0.05, 0.1, 0.4, 0.2, 0.15, 0.1, 0],
  AM: [0.1, 0.25, 0.35, 0.3, 0, 0, 0],
  LW: [0.35, 0.15, 0.15, 0.35, 0, 0, 0],
  RW: [0.35, 0.15, 0.15, 0.35, 0, 0, 0],
  ST: [0.2, 0.5, 0, 0.15, 0, 0.15, 0],
};
// Attribute bias relative to target overall
const POS_BIAS = {
  GK: [-25, -45, -18, -30, -40, -10, 0],
  CB: [-8, -30, -10, -15, 3, 2, -60],
  LB: [2, -22, -4, -4, -1, -10, -60],
  RB: [2, -22, -4, -4, -1, -10, -60],
  DM: [-10, -15, -1, -6, 1, 0, -60],
  CM: [-6, -6, 2, -1, -10, -6, -60],
  AM: [-2, -2, 1, 1, -35, -14, -60],
  LW: [2, -5, -5, 2, -40, -18, -60],
  RW: [2, -5, -5, 2, -40, -18, -60],
  ST: [-1, 2, -14, -4, -45, 0, -60],
};

const FORMATIONS = {
  "4-3-3": ["GK", "RB", "CB", "CB", "LB", "CM", "DM", "CM", "RW", "ST", "LW"],
  "4-2-3-1": ["GK", "RB", "CB", "CB", "LB", "DM", "DM", "RW", "AM", "LW", "ST"],
  "4-4-2": ["GK", "RB", "CB", "CB", "LB", "RW", "CM", "CM", "LW", "ST", "ST"],
  "4-1-4-1": ["GK", "RB", "CB", "CB", "LB", "DM", "RW", "CM", "CM", "LW", "ST"],
  "3-5-2": ["GK", "CB", "CB", "CB", "RB", "CM", "DM", "CM", "LB", "ST", "ST"],
  "3-4-3": ["GK", "CB", "CB", "CB", "RB", "CM", "CM", "LB", "RW", "ST", "LW"],
  "5-3-2": ["GK", "RB", "CB", "CB", "CB", "LB", "CM", "DM", "CM", "ST", "ST"],
  "4-4-2 Diamond": ["GK", "RB", "CB", "CB", "LB", "DM", "CM", "CM", "AM", "ST", "ST"],
};
// Pitch coordinates (x 0-100 left→right, y 0-100 own goal→opp goal) per formation slot
const FORM_XY = {
  "4-3-3": [[50, 6], [85, 28], [62, 22], [38, 22], [15, 28], [72, 50], [50, 42], [28, 50], [82, 76], [50, 84], [18, 76]],
  "4-2-3-1": [[50, 6], [85, 28], [62, 22], [38, 22], [15, 28], [62, 42], [38, 42], [80, 64], [50, 64], [20, 64], [50, 84]],
  "4-4-2": [[50, 6], [85, 28], [62, 22], [38, 22], [15, 28], [84, 54], [60, 48], [40, 48], [16, 54], [62, 80], [38, 80]],
  "4-1-4-1": [[50, 6], [85, 28], [62, 22], [38, 22], [15, 28], [50, 40], [84, 60], [62, 56], [38, 56], [16, 60], [50, 84]],
  "3-5-2": [[50, 6], [72, 22], [50, 20], [28, 22], [88, 52], [68, 52], [50, 42], [32, 52], [12, 52], [62, 80], [38, 80]],
  "3-4-3": [[50, 6], [72, 22], [50, 20], [28, 22], [86, 50], [60, 48], [40, 48], [14, 50], [80, 78], [50, 84], [20, 78]],
  "5-3-2": [[50, 6], [88, 32], [70, 22], [50, 20], [30, 22], [12, 32], [70, 52], [50, 44], [30, 52], [62, 80], [38, 80]],
  "4-4-2 Diamond": [[50, 6], [85, 28], [62, 22], [38, 22], [15, 28], [50, 38], [70, 52], [30, 52], [50, 64], [62, 82], [38, 82]],
};
// Positions a player can cover with small penalty
const POS_NEAR = {
  GK: [], CB: ["DM", "RB", "LB"], LB: ["RB", "CB", "LW"], RB: ["LB", "CB", "RW"], DM: ["CM", "CB"],
  CM: ["DM", "AM"], AM: ["CM", "LW", "RW", "ST"], LW: ["RW", "AM", "ST"], RW: ["LW", "AM", "ST"], ST: ["AM", "LW", "RW"],
};
