/* Touchline — optional real-player pack (2025/26 squads, approximate ratings).
   Row: Name|POS|birth year|overall|NAT|potential (optional)|traits (optional)
   Traits nudge attributes: P pace, S shooting, K passing, D dribbling, T tackling, H physical. */
"use strict";
const REAL_PLAYERS = {
"Arsenal": `David Raya|GK|1995|86|ESP
Kepa Arrizabalaga|GK|1994|79|ESP
William Saliba|CB|2001|87|FRA||PT
Gabriel Magalhães|CB|1997|86|BRA||H
Piero Hincapié|CB|2002|81|ECU
Cristhian Mosquera|CB|2004|77|ESP|85
Jurriën Timber|RB|2001|83|NED
Ben White|RB|1997|81|ENG
Riccardo Calafiori|LB|2002|81|ITA
Myles Lewis-Skelly|LB|2006|77|ENG|88
Declan Rice|CM|1999|88|ENG||TK
Martín Zubimendi|DM|1999|86|ESP||K
Martin Ødegaard|AM|1998|87|NOR||K
Mikel Merino|CM|1996|83|ESP
Christian Nørgaard|DM|1994|79|DEN
Eberechi Eze|AM|1998|84|ENG||D
Bukayo Saka|RW|2001|88|ENG||D
Noni Madueke|RW|2002|80|ENG
Gabriel Martinelli|LW|2001|81|BRA||P
Leandro Trossard|LW|1994|81|BEL
Viktor Gyökeres|ST|1998|86|SWE||SH
Kai Havertz|ST|1999|83|GER
Gabriel Jesus|ST|1997|78|BRA
Ethan Nwaneri|AM|2007|76|ENG|89
Max Dowman|RW|2009|66|ENG|90`,
"Liverpool": `Alisson Becker|GK|1992|88|BRA
Giorgi Mamardashvili|GK|2000|82|GEO|87
Virgil van Dijk|CB|1991|88|NED||TH
Ibrahima Konaté|CB|1999|85|FRA||P
Joe Gomez|CB|1997|78|ENG
Giovanni Leoni|CB|2006|72|ITA|87
Jeremie Frimpong|RB|2000|83|NED||P
Conor Bradley|RB|2003|78|NIR
Milos Kerkez|LB|2003|81|HUN
Andrew Robertson|LB|1994|81|SCO
Ryan Gravenberch|DM|2002|85|NED
Alexis Mac Allister|CM|1998|86|ARG||K
Dominik Szoboszlai|CM|2000|84|HUN||S
Curtis Jones|CM|2001|80|ENG
Wataru Endo|DM|1993|76|JPN
Florian Wirtz|AM|2003|88|GER|92|KD
Mohamed Salah|RW|1992|89|EGY||SP
Cody Gakpo|LW|1999|84|NED
Federico Chiesa|RW|1997|77|ITA
Alexander Isak|ST|1999|87|SWE||SD
Hugo Ekitike|ST|2002|83|FRA|88|P
Rio Ngumoha|LW|2008|65|ENG|88`,
"Manchester City": `Gianluigi Donnarumma|GK|1999|88|ITA
James Trafford|GK|2002|78|ENG
Rúben Dias|CB|1997|86|POR||T
Joško Gvardiol|CB|2002|85|CRO
John Stones|CB|1994|81|ENG
Nathan Aké|CB|1995|80|NED
Abdukodir Khusanov|CB|2004|75|UZB|85
Rico Lewis|RB|2004|79|ENG
Matheus Nunes|RB|1998|79|POR
Rayan Aït-Nouri|LB|2001|82|ALG
Rodri|DM|1996|89|ESP||KT
Tijjani Reijnders|CM|1998|85|NED
Bernardo Silva|CM|1994|84|POR||D
Mateo Kovačić|CM|1994|81|CRO
Nico González|DM|2002|80|ESP
Phil Foden|AM|2000|86|ENG||D
Rayan Cherki|AM|2003|82|FRA|89|D
Jérémy Doku|LW|2002|82|BEL||PD
Savinho|RW|2004|80|BRA|88
Oscar Bobb|RW|2003|75|NOR
Omar Marmoush|ST|1999|83|EGY
Erling Haaland|ST|2000|91|NOR||SH`,
"Chelsea": `Robert Sánchez|GK|1997|79|ESP
Filip Jørgensen|GK|2002|75|DEN
Levi Colwill|CB|2003|82|ENG
Wesley Fofana|CB|2000|80|FRA
Trevoh Chalobah|CB|1999|80|ENG
Tosin Adarabioyo|CB|1997|77|ENG
Reece James|RB|1999|84|ENG
Malo Gusto|RB|2003|80|FRA
Marc Cucurella|LB|1998|83|ESP
Jorrel Hato|LB|2006|77|NED|88
Moisés Caicedo|DM|2001|87|ECU||T
Enzo Fernández|CM|2001|85|ARG||K
Roméo Lavia|DM|2004|78|BEL
Andrey Santos|CM|2004|77|BRA
Cole Palmer|AM|2002|88|ENG||KS
Pedro Neto|RW|2000|82|POR||P
Estêvão|RW|2007|78|BRA|91|D
Jamie Gittens|LW|2004|79|ENG|86
Alejandro Garnacho|LW|2004|80|ARG
João Pedro|ST|2001|83|BRA
Liam Delap|ST|2003|77|ENG|85`,
"Manchester United": `Senne Lammens|GK|2002|76|BEL|84
Altay Bayındır|GK|1998|74|TUR
Matthijs de Ligt|CB|1999|83|NED
Lisandro Martínez|CB|1998|83|ARG
Leny Yoro|CB|2005|79|FRA|88
Harry Maguire|CB|1993|78|ENG
Ayden Heaven|CB|2006|69|ENG|83
Diogo Dalot|RB|1999|80|POR
Noussair Mazraoui|RB|1997|79|MAR
Patrick Dorgu|LB|2004|77|DEN
Luke Shaw|LB|1995|77|ENG
Bruno Fernandes|AM|1994|86|POR||K
Casemiro|DM|1992|80|BRA
Manuel Ugarte|DM|2001|79|URU
Kobbie Mainoo|CM|2005|79|ENG|87
Mason Mount|AM|1999|78|ENG
Bryan Mbeumo|RW|1999|84|CMR
Matheus Cunha|LW|1999|84|BRA||D
Amad Diallo|RW|2002|80|CIV
Benjamin Šeško|ST|2003|81|SVN|88|H
Joshua Zirkzee|ST|2001|76|NED`,
"Tottenham Hotspur": `Guglielmo Vicario|GK|1996|83|ITA
Cristian Romero|CB|1998|85|ARG||T
Micky van de Ven|CB|2001|84|NED||P
Kevin Danso|CB|1998|78|AUT
Pedro Porro|RB|1999|83|ESP
Djed Spence|RB|2000|76|ENG
Destiny Udogie|LB|2002|80|ITA
João Palhinha|DM|1995|83|POR||T
Rodrigo Bentancur|CM|1997|80|URU
Pape Matar Sarr|CM|2002|79|SEN
Lucas Bergvall|CM|2006|77|SWE|88
Archie Gray|CM|2006|75|ENG|85
James Maddison|AM|1996|82|ENG
Xavi Simons|AM|2003|83|NED|88
Mohammed Kudus|RW|2000|83|GHA||D
Brennan Johnson|RW|2001|79|WAL
Wilson Odobert|LW|2004|75|FRA
Dominic Solanke|ST|1997|81|ENG
Randal Kolo Muani|ST|1998|80|FRA
Richarlison|ST|1997|77|BRA`,
"Newcastle United": `Nick Pope|GK|1992|82|ENG
Aaron Ramsdale|GK|1998|78|ENG
Sven Botman|CB|2000|81|NED
Fabian Schär|CB|1991|80|SUI
Malick Thiaw|CB|2001|80|GER
Dan Burn|CB|1992|79|ENG
Kieran Trippier|RB|1990|79|ENG
Tino Livramento|RB|2002|80|ENG
Lewis Hall|LB|2004|79|ENG
Bruno Guimarães|CM|1997|86|BRA||K
Sandro Tonali|DM|2000|84|ITA
Joelinton|CM|1996|81|BRA||H
Jacob Ramsey|CM|2001|77|ENG
Anthony Gordon|LW|2001|82|ENG||P
Harvey Barnes|LW|1997|78|ENG
Anthony Elanga|RW|2002|80|SWE||P
Jacob Murphy|RW|1995|78|ENG
Nick Woltemade|ST|2002|80|GER|86
Yoane Wissa|ST|1996|81|COD`,
"Aston Villa": `Emiliano Martínez|GK|1992|85|ARG
Ezri Konsa|CB|1997|82|ENG
Pau Torres|CB|1997|82|ESP
Matty Cash|RB|1997|79|POL
Lucas Digne|LB|1993|78|FRA
Ian Maatsen|LB|2002|78|NED
Boubacar Kamara|DM|1999|82|FRA
Amadou Onana|DM|2001|81|BEL
Youri Tielemans|CM|1997|83|BEL||K
John McGinn|CM|1994|80|SCO
Morgan Rogers|AM|2002|82|ENG|87
Emiliano Buendía|AM|1996|77|ARG
Jadon Sancho|LW|2000|78|ENG
Evann Guessand|RW|2001|77|CIV
Ollie Watkins|ST|1995|83|ENG||S`,
"Crystal Palace": `Dean Henderson|GK|1997|82|ENG
Marc Guéhi|CB|2000|84|ENG
Maxence Lacroix|CB|2000|80|FRA
Daniel Muñoz|RB|1996|81|COL
Tyrick Mitchell|LB|1999|79|ENG
Adam Wharton|CM|2004|80|ENG|87|K
Jefferson Lerma|DM|1994|78|COL
Ismaïla Sarr|RW|1998|80|SEN
Yeremy Pino|LW|2002|78|ESP
Jean-Philippe Mateta|ST|1997|81|FRA`,
"Brighton & Hove Albion": `Bart Verbruggen|GK|2002|79|NED
Jan Paul van Hecke|CB|2000|79|NED
Lewis Dunk|CB|1991|78|ENG
Carlos Baleba|DM|2004|80|CMR|87
Pascal Groß|CM|1991|80|GER||K
Georginio Rutter|AM|2002|78|FRA
Kaoru Mitoma|LW|1997|81|JPN||D
Yankuba Minteh|RW|2004|77|GAM
Danny Welbeck|ST|1990|76|ENG`,
"Bournemouth": `Đorđe Petrović|GK|1999|78|SRB
Marcos Senesi|CB|1997|78|ARG
Adam Smith|RB|1991|75|ENG
Tyler Adams|DM|1999|78|USA
Marcus Tavernier|AM|1999|78|ENG
Antoine Semenyo|RW|2000|82|GHA||P
Justin Kluivert|LW|1999|78|NED
Evanilson|ST|1999|78|BRA`,
"Brentford": `Caoimhín Kelleher|GK|1998|80|IRL
Nathan Collins|CB|2001|78|IRL
Mikkel Damsgaard|AM|2000|79|DEN
Mathias Jensen|CM|1996|77|DEN
Kevin Schade|LW|2001|78|GER
Igor Thiago|ST|2001|78|BRA`,
"Nottingham Forest": `Matz Sels|GK|1992|81|BEL
Murillo|CB|2002|81|BRA
Nikola Milenković|CB|1997|81|SRB
Neco Williams|RB|2001|78|WAL
Elliot Anderson|CM|2002|82|ENG|87
Morgan Gibbs-White|AM|2000|82|ENG
Callum Hudson-Odoi|LW|2000|79|ENG
Dan Ndoye|RW|2000|79|SUI
Chris Wood|ST|1991|80|NZL||H`,
"Fulham": `Bernd Leno|GK|1992|81|GER
Antonee Robinson|LB|1997|80|USA
Sander Berge|DM|1998|78|NOR
Alex Iwobi|AM|1996|79|NGA
Emile Smith Rowe|AM|2000|77|ENG
Raúl Jiménez|ST|1991|78|MEX`,
"Everton": `Jordan Pickford|GK|1994|83|ENG
Jarrad Branthwaite|CB|2002|80|ENG
James Tarkowski|CB|1992|78|ENG
James Garner|CM|2001|78|ENG
Kiernan Dewsbury-Hall|CM|2001|78|ENG
Jack Grealish|LW|1995|80|ENG||D
Iliman Ndiaye|LW|2000|80|SEN
Dominic Calvert-Lewin|ST|1997|76|ENG`,
"West Ham United": `Alphonse Areola|GK|1993|79|FRA
Aaron Wan-Bissaka|RB|1997|78|ENG
Tomáš Souček|CM|1995|78|CZE
Lucas Paquetá|AM|1997|81|BRA
Jarrod Bowen|RW|1996|82|ENG
Niclas Füllkrug|ST|1993|76|GER`,
"Wolverhampton": `José Sá|GK|1993|78|POR
João Gomes|CM|2001|79|BRA
André|DM|2001|77|BRA
Jørgen Strand Larsen|ST|2000|79|NOR`,
"Sunderland": `Robin Roefs|GK|2003|75|NED|83
Granit Xhaka|CM|1992|82|SUI||K
Habib Diarra|CM|2004|76|SEN
Enzo Le Fée|AM|2000|77|FRA`,
"Burnley": `Martin Dúbravka|GK|1989|77|SVK
Kyle Walker|RB|1990|78|ENG
Lyle Foster|ST|2000|74|RSA`,
"Leeds United": `Lucas Perri|GK|1997|77|BRA
Ethan Ampadu|DM|2000|77|WAL
Noah Okafor|LW|2000|76|SUI`,
"Real Madrid": `Thibaut Courtois|GK|1992|89|BEL
Andriy Lunin|GK|1999|78|UKR
Dani Carvajal|RB|1992|83|ESP
Trent Alexander-Arnold|RB|1998|85|ENG||K
Éder Militão|CB|1998|84|BRA
Antonio Rüdiger|CB|1993|84|GER||H
Dean Huijsen|CB|2005|81|ESP|90
Raúl Asencio|CB|2003|76|ESP
Álvaro Carreras|LB|2003|80|ESP
Ferland Mendy|LB|1995|79|FRA
Aurélien Tchouaméni|DM|2000|85|FRA
Federico Valverde|CM|1998|88|URU||H
Eduardo Camavinga|CM|2002|83|FRA
Jude Bellingham|AM|2003|89|ENG||S
Arda Güler|AM|2005|82|TUR|90|K
Dani Ceballos|CM|1996|78|ESP
Vinícius Júnior|LW|2000|89|BRA||PD
Rodrygo|RW|2001|84|BRA
Brahim Díaz|RW|1999|80|MAR
Franco Mastantuono|RW|2007|76|ARG|90
Kylian Mbappé|ST|1998|91|FRA||PS
Endrick|ST|2006|75|BRA|89`,
"Barcelona": `Joan García|GK|2001|83|ESP|88
Marc-André ter Stegen|GK|1992|84|GER
Wojciech Szczęsny|GK|1990|79|POL
Jules Koundé|RB|1998|85|FRA
Pau Cubarsí|CB|2007|82|ESP|92|K
Ronald Araújo|CB|1999|82|URU
Eric García|CB|2001|79|ESP
Andreas Christensen|CB|1996|79|DEN
Alejandro Balde|LB|2003|82|ESP||P
Frenkie de Jong|CM|1997|86|NED||K
Pedri|CM|2002|89|ESP||KD
Gavi|CM|2004|82|ESP
Marc Casadó|DM|2003|78|ESP
Dani Olmo|AM|2001|84|ESP
Fermín López|AM|2003|81|ESP
Lamine Yamal|RW|2007|89|ESP|96|DK
Raphinha|LW|1996|87|BRA
Marcus Rashford|LW|1997|81|ENG
Robert Lewandowski|ST|1988|85|POL||S
Ferran Torres|ST|2000|80|ESP
Roony Bardghji|RW|2005|71|SWE|84`,
"Atlético Madrid": `Jan Oblak|GK|1993|86|SVN
Juan Musso|GK|1994|78|ARG
José María Giménez|CB|1995|81|URU
Robin Le Normand|CB|1996|81|ESP
Dávid Hancko|CB|1997|81|SVK
Clément Lenglet|CB|1995|78|FRA
Nahuel Molina|RB|1998|79|ARG
Marc Pubill|RB|2003|76|ESP
Matteo Ruggeri|LB|2002|77|ITA
Koke|CM|1992|80|ESP
Pablo Barrios|CM|2003|81|ESP|87
Johnny Cardoso|DM|2001|78|USA
Conor Gallagher|CM|2000|81|ENG
Álex Baena|AM|2001|83|ESP
Thiago Almada|AM|2001|79|ARG
Giuliano Simeone|RW|2002|78|ARG
Nicolás González|LW|1998|80|ARG
Antoine Griezmann|ST|1991|84|FRA||K
Julián Álvarez|ST|2000|87|ARG||S
Alexander Sørloth|ST|1995|82|NOR||H
Giacomo Raspadori|ST|2000|78|ITA`,
"Athletic Club": `Unai Simón|GK|1997|84|ESP
Dani Vivian|CB|1999|82|ESP
Aymeric Laporte|CB|1994|81|ESP
Oihan Sancet|AM|2000|81|ESP
Mikel Jauregizar|CM|2003|76|ESP
Nico Williams|LW|2002|85|ESP||PD
Iñaki Williams|RW|1994|80|GHA||P
Gorka Guruzeta|ST|1996|77|ESP`,
"Villarreal": `Luiz Júnior|GK|2001|79|BRA
Juan Foyth|CB|1998|79|ARG
Renato Veiga|CB|2003|77|POR
Thomas Partey|DM|1993|80|GHA
Pape Gueye|CM|1999|79|SEN
Alberto Moleiro|AM|2003|79|ESP
Ayoze Pérez|ST|1993|81|ESP
Georges Mikautadze|ST|2000|79|GEO
Gerard Moreno|ST|1992|79|ESP`,
"Real Betis": `Isco|AM|1992|82|ESP||K
Giovani Lo Celso|CM|1996|80|ARG
Antony|RW|2000|80|BRA
Cucho Hernández|ST|1999|78|COL`,
"Real Sociedad": `Álex Remiro|GK|1995|82|ESP
Brais Méndez|AM|1997|80|ESP
Takefusa Kubo|RW|2001|82|JPN||D
Mikel Oyarzabal|ST|1997|83|ESP`,
"Celta Vigo": `Iago Aspas|ST|1987|78|ESP
Borja Iglesias|ST|1993|78|ESP`,
"Bayern Munich": `Manuel Neuer|GK|1986|86|GER
Jonas Urbig|GK|2003|74|GER|84
Dayot Upamecano|CB|1998|84|FRA
Jonathan Tah|CB|1996|84|GER
Kim Min-jae|CB|1996|83|KOR
Hiroki Ito|CB|1999|79|JPN
Konrad Laimer|RB|1997|81|AUT
Josip Stanišić|RB|2000|79|CRO
Alphonso Davies|LB|2000|83|CAN||P
Raphaël Guerreiro|LB|1993|79|POR
Joshua Kimmich|DM|1995|87|GER||K
Aleksandar Pavlović|CM|2004|82|GER|88
Leon Goretzka|CM|1995|81|GER
Tom Bischof|CM|2005|75|GER|85
Jamal Musiala|AM|2003|88|GER|93|D
Michael Olise|RW|2001|87|FRA||DK
Serge Gnabry|RW|1995|82|GER
Luis Díaz|LW|1997|86|COL||PD
Lennart Karl|RW|2008|70|GER|89
Harry Kane|ST|1993|90|ENG||SK
Nicolas Jackson|ST|2001|80|SEN`,
"Borussia Dortmund": `Gregor Kobel|GK|1997|86|SUI
Nico Schlotterbeck|CB|1999|83|GER
Waldemar Anton|CB|1996|80|GER
Ramy Bensebaini|LB|1995|78|ALG
Julian Ryerson|RB|1997|78|NOR
Emre Can|DM|1994|79|GER
Marcel Sabitzer|CM|1994|80|AUT
Felix Nmecha|CM|2000|79|GER
Jobe Bellingham|CM|2005|77|ENG|87
Julian Brandt|AM|1996|81|GER
Karim Adeyemi|LW|2002|80|GER||P
Maximilian Beier|ST|2002|79|GER
Serhou Guirassy|ST|1996|84|GUI||S`,
"Bayer Leverkusen": `Mark Flekken|GK|1993|80|NED
Edmond Tapsoba|CB|1999|81|BFA
Jarell Quansah|CB|2003|76|ENG
Alejandro Grimaldo|LB|1995|84|ESP||K
Exequiel Palacios|CM|1998|82|ARG
Robert Andrich|DM|1994|80|GER
Equi Fernández|CM|2002|77|ARG
Malik Tillman|AM|2002|80|USA
Ibrahim Maza|AM|2005|73|ALG|86
Ernest Poku|RW|2004|76|NED
Martin Terrier|LW|1997|79|FRA
Patrik Schick|ST|1996|82|CZE`,
"RB Leipzig": `Péter Gulácsi|GK|1990|81|HUN
Willi Orbán|CB|1992|81|HUN
Castello Lukeba|CB|2002|81|FRA
David Raum|LB|1998|80|GER
Xaver Schlager|CM|1997|81|AUT
Christoph Baumgartner|AM|1999|80|AUT
Antonio Nusa|LW|2005|77|NOR|87
Rômulo|ST|2001|75|BRA`,
"VfB Stuttgart": `Alexander Nübel|GK|1996|82|GER
Angelo Stiller|DM|2001|81|GER
Chris Führich|LW|1998|79|GER
Deniz Undav|ST|1996|80|GER`,
"Eintracht Frankfurt": `Kauã Santos|GK|2003|76|BRA
Robin Koch|CB|1996|80|GER
Hugo Larsson|CM|2004|79|SWE
Can Uzun|AM|2005|77|TUR|87
Mario Götze|AM|1992|77|GER
Ritsu Doan|RW|1998|79|JPN
Jonathan Burkardt|ST|2000|79|GER`,
"Inter": `Yann Sommer|GK|1988|84|SUI
Josep Martínez|GK|1998|77|ESP
Alessandro Bastoni|CB|1999|86|ITA||K
Francesco Acerbi|CB|1988|80|ITA
Stefan de Vrij|CB|1992|80|NED
Manuel Akanji|CB|1995|82|SUI
Yann Bisseck|CB|2000|79|GER
Denzel Dumfries|RB|1996|83|NED||P
Federico Dimarco|LB|1997|84|ITA||K
Hakan Çalhanoğlu|DM|1994|85|TUR||K
Nicolò Barella|CM|1997|86|ITA
Henrikh Mkhitaryan|CM|1989|80|ARM
Davide Frattesi|CM|1999|80|ITA
Piotr Zieliński|CM|1994|80|POL
Petar Sučić|CM|2003|77|CRO|86
Lautaro Martínez|ST|1997|88|ARG||S
Marcus Thuram|ST|1997|84|FRA||PH
Ange-Yoan Bonny|ST|2003|76|FRA
Francesco Pio Esposito|ST|2005|72|ITA|85`,
"AC Milan": `Mike Maignan|GK|1995|87|FRA
Fikayo Tomori|CB|1997|81|ENG
Strahinja Pavlović|CB|2001|80|SRB
Koni De Winter|CB|2002|77|BEL
Pervis Estupiñán|LB|1998|80|ECU
Alexis Saelemaekers|RB|1999|79|BEL
Luka Modrić|CM|1985|84|CRO||K
Adrien Rabiot|CM|1995|82|FRA
Youssouf Fofana|DM|1999|81|FRA
Ruben Loftus-Cheek|CM|1996|78|ENG
Samuele Ricci|DM|2001|79|ITA
Ardon Jashari|CM|2002|77|SUI
Christian Pulisic|RW|1998|84|USA
Rafael Leão|LW|1999|85|POR||PD
Christopher Nkunku|ST|1997|80|FRA
Santiago Giménez|ST|2001|79|MEX`,
"Juventus": `Michele Di Gregorio|GK|1997|82|ITA
Gleison Bremer|CB|1997|84|BRA||T
Federico Gatti|CB|1998|79|ITA
Pierre Kalulu|CB|2000|79|FRA
Lloyd Kelly|CB|1998|77|ENG
Andrea Cambiaso|LB|2000|82|ITA
Manuel Locatelli|DM|1998|82|ITA
Khéphren Thuram|CM|2001|81|FRA
Teun Koopmeiners|CM|1998|81|NED
Weston McKennie|CM|1998|79|USA
Kenan Yıldız|LW|2005|83|TUR|91|D
Francisco Conceição|RW|2002|81|POR
Edon Zhegrova|RW|1999|80|KOS
Jonathan David|ST|2000|83|CAN
Dušan Vlahović|ST|2000|82|SRB
Loïs Openda|ST|2000|80|BEL`,
"Napoli": `Alex Meret|GK|1997|82|ITA
Vanja Milinković-Savić|GK|1997|80|SRB
Giovanni Di Lorenzo|RB|1993|82|ITA
Amir Rrahmani|CB|1994|81|KOS
Alessandro Buongiorno|CB|1999|82|ITA
Sam Beukema|CB|1998|80|NED
Mathías Olivera|LB|1997|79|URU
Stanislav Lobotka|DM|1994|84|SVK||K
Frank Anguissa|CM|1995|82|CMR
Scott McTominay|CM|1996|85|SCO||S
Kevin De Bruyne|AM|1991|85|BEL||K
Matteo Politano|RW|1993|79|ITA
David Neres|RW|1997|79|BRA
Noa Lang|LW|1999|80|NED
Romelu Lukaku|ST|1993|81|BEL||H
Rasmus Højlund|ST|2003|79|DEN`,
"Roma": `Mile Svilar|GK|1999|84|SRB
Gianluca Mancini|CB|1996|80|ITA
Evan Ndicka|CB|1999|80|CIV
Wesley|RB|2003|77|BRA
Bryan Cristante|CM|1995|78|ITA
Manu Koné|CM|2001|81|FRA
Lorenzo Pellegrini|AM|1996|78|ITA
Paulo Dybala|AM|1993|82|ARG||K
Matías Soulé|RW|2003|79|ARG
Artem Dovbyk|ST|1997|80|UKR
Evan Ferguson|ST|2004|76|IRL`,
"Atalanta": `Marco Carnesecchi|GK|2000|82|ITA
Isak Hien|CB|1999|80|SWE
Marten de Roon|DM|1991|79|NED
Éderson|CM|1999|82|BRA
Charles De Ketelaere|AM|2001|82|BEL
Ademola Lookman|LW|1997|84|NGA||D
Gianluca Scamacca|ST|1999|79|ITA`,
"Lazio": `Ivan Provedel|GK|1994|80|ITA
Alessio Romagnoli|CB|1995|79|ITA
Matteo Guendouzi|CM|1999|80|FRA
Mattia Zaccagni|LW|1995|80|ITA
Taty Castellanos|ST|1998|79|ARG`,
"Bologna": `Riccardo Orsolini|RW|1997|80|ITA
Santiago Castro|ST|2004|76|ARG`,
"Como": `Nico Paz|AM|2004|80|ARG|89|K
Álvaro Morata|ST|1992|78|ESP`,
"Paris Saint-Germain": `Lucas Chevalier|GK|2001|82|FRA
Achraf Hakimi|RB|1998|88|MAR||P
Marquinhos|CB|1994|85|BRA
Willian Pacho|CB|2001|84|ECU
Illia Zabarnyi|CB|2002|80|UKR
Lucas Beraldo|CB|2003|76|BRA
Nuno Mendes|LB|2002|86|POR||P
Lucas Hernández|LB|1996|79|FRA
Vitinha|CM|2000|88|POR||K
João Neves|CM|2004|86|POR|91
Warren Zaïre-Emery|CM|2006|81|FRA|89
Fabián Ruiz|CM|1996|83|ESP
Lee Kang-in|AM|2001|80|KOR
Désiré Doué|RW|2005|84|FRA|92|D
Khvicha Kvaratskhelia|LW|2001|87|GEO||D
Bradley Barcola|LW|2002|83|FRA||P
Ousmane Dembélé|ST|1997|90|FRA||PD
Gonçalo Ramos|ST|2001|79|POR
Senny Mayulu|CM|2006|72|FRA|85`,
"Marseille": `Gerónimo Rulli|GK|1992|81|ARG
Benjamin Pavard|CB|1996|80|FRA
Leonardo Balerdi|CB|1999|80|ARG
Nayef Aguerd|CB|1996|80|MAR
Pierre-Emile Højbjerg|DM|1995|81|DEN
Matt O'Riley|CM|2000|78|DEN
Angel Gomes|CM|2000|77|ENG
Mason Greenwood|RW|2001|82|ENG||S
Igor Paixão|LW|2000|78|BRA
Amine Gouiri|ST|2000|80|ALG
Pierre-Emerick Aubameyang|ST|1989|79|GAB`,
"Monaco": `Thilo Kehrer|CB|1996|78|GER
Eric Dier|CB|1994|77|ENG
Lamine Camara|CM|2004|79|SEN
Maghnes Akliouche|AM|2002|80|FRA|87
Takumi Minamino|AM|1995|79|JPN
Paul Pogba|CM|1993|76|FRA
Ansu Fati|LW|2002|76|ESP
Folarin Balogun|ST|2001|78|USA`,
"Lille": `Hákon Arnar Haraldsson|AM|2003|80|ISL
Hamza Igamane|ST|2002|75|MAR
Olivier Giroud|ST|1986|74|FRA`,
"Lyon": `Corentin Tolisso|CM|1994|79|FRA
Malick Fofana|LW|2005|78|BEL|87`,
"Benfica": `Anatoliy Trubin|GK|2001|82|UKR
Nicolás Otamendi|CB|1988|80|ARG
António Silva|CB|2003|80|POR
Tomás Araújo|CB|2002|79|POR
Amar Dedić|RB|2002|78|BIH
Fredrik Aursnes|CM|1995|80|NOR
Richard Ríos|CM|2000|79|COL
Georgiy Sudakov|AM|2002|79|UKR
Dodi Lukébakio|RW|1997|79|BEL
Andreas Schjelderup|LW|2004|76|NOR
Vangelis Pavlidis|ST|1998|81|GRE`,
"Porto": `Diogo Costa|GK|1999|85|POR
Jan Bednarek|CB|1996|79|POL
Francisco Moura|LB|1999|77|POR
Alan Varela|DM|2001|80|ARG
Gabri Veiga|CM|2002|79|ESP
Rodrigo Mora|AM|2007|75|POR|89
William Gomes|RW|2006|74|BRA|85
Samu Aghehowa|ST|2004|80|ESP|88`,
"Sporting CP": `Rui Silva|GK|1994|81|POR
Ousmane Diomande|CB|2003|80|CIV
Gonçalo Inácio|CB|2001|81|POR
Maxi Araújo|LB|2000|79|URU
Morten Hjulmand|DM|1999|82|DEN
Pedro Gonçalves|AM|1998|81|POR
Francisco Trincão|RW|1999|82|POR
Geovany Quenda|RW|2007|76|POR|89
Luis Suárez|ST|1997|79|COL`,
"Galatasaray": `Uğurcan Çakır|GK|1996|81|TUR
Davinson Sánchez|CB|1996|80|COL
Abdülkerim Bardakcı|CB|1994|79|TUR
Lucas Torreira|DM|1996|80|URU
İlkay Gündoğan|CM|1990|81|GER||K
Gabriel Sara|CM|1999|79|BRA
Leroy Sané|RW|1996|82|GER||P
Barış Alper Yılmaz|LW|2000|79|TUR
Victor Osimhen|ST|1998|87|NGA||SH
Mauro Icardi|ST|1993|79|ARG`,
"Fenerbahçe": `Ederson|GK|1993|85|BRA
Milan Škriniar|CB|1995|81|SVK
Nélson Semedo|RB|1993|79|POR
Edson Álvarez|DM|1997|80|MEX
Fred|CM|1993|78|BRA
Marco Asensio|AM|1996|80|ESP
Talisca|AM|1994|78|BRA
Kerem Aktürkoğlu|LW|1998|80|TUR
Youssef En-Nesyri|ST|1997|80|MAR||H
Jhon Durán|ST|2003|79|COL`,
"Beşiktaş": `Wilfred Ndidi|DM|1996|79|NGA
Orkun Kökçü|CM|2000|81|TUR
Rafa Silva|AM|1993|79|POR
Tammy Abraham|ST|1997|78|ENG`,
"Trabzonspor": `André Onana|GK|1996|81|CMR
Paul Onuachu|ST|1994|77|NGA`,
"Ajax": `Josip Šutalo|CB|2000|79|CRO
Youri Baas|LB|2003|77|NED
Kenneth Taylor|CM|2002|79|NED
Mika Godts|LW|2005|76|BEL|86
Wout Weghorst|ST|1992|76|NED`,
"PSV": `Ryan Flamingo|CB|2002|76|NED
Jerdy Schouten|DM|1997|79|NED
Joey Veerman|CM|1998|80|NED
Guus Til|AM|1997|77|NED
Ismael Saibari|AM|2001|79|MAR
Ivan Perišić|LW|1989|79|CRO
Ricardo Pepi|ST|2003|77|USA`,
"Feyenoord": `Justin Bijlow|GK|1998|79|NED
Quinten Timber|CM|2001|80|NED
Hwang In-beom|CM|1996|79|KOR
Sem Steijn|AM|2001|77|NED
Anis Hadj Moussa|RW|2002|78|ALG
Ayase Ueda|ST|1998|77|JPN`,
"AZ Alkmaar": `Troy Parrott|ST|2002|77|IRL`,
"Celtic": `Kasper Schmeichel|GK|1986|79|DEN
Cameron Carter-Vickers|CB|1997|79|USA
Liam Scales|CB|1998|75|IRL
Callum McGregor|CM|1993|79|SCO
Arne Engels|CM|2003|77|BEL
Reo Hatate|CM|1997|79|JPN
Benjamin Nygren|AM|2001|76|SWE
Daizen Maeda|LW|1997|80|JPN||P
Kelechi Iheanacho|ST|1996|76|NGA`,
"Rangers": `Jack Butland|GK|1993|79|ENG
James Tavernier|RB|1991|76|ENG
Nicolas Raskin|CM|2001|77|BEL
Mohamed Diomande|CM|2001|77|CIV
Djeidi Gassama|RW|2003|75|FRA`,
"Club Brugge": `Simon Mignolet|GK|1988|77|BEL
Raphael Onyedika|DM|2001|78|NGA
Hans Vanaken|AM|1992|79|BEL
Christos Tzolis|LW|2002|79|GRE`,
"Al Ahly": `Mohamed El Shenawy|GK|1988|76|EGY
Mostafa Shobeir|GK|2000|72|EGY|78
Yasser Ibrahim|CB|1993|72|EGY
Mohamed Hany|RB|1996|72|EGY
Ali Maaloul|LB|1990|71|TUN
Marwan Attia|DM|1998|72|EGY
Emam Ashour|CM|1998|75|EGY||K
Mohamed Ali Ben Romdhane|CM|1999|74|TUN
Ahmed Sayed Zizo|RW|1996|76|EGY||D
Trezeguet|LW|1994|76|EGY
Hussein El Shahat|RW|1992|72|EGY
Taher Mohamed Taher|RW|1997|71|EGY
Mohamed Sherif|ST|1996|72|EGY
Mahmoud Kahraba|ST|1994|71|EGY`,
"Zamalek": `Mohamed Awad|GK|1992|72|EGY
Hossam Abdelmaguid|CB|2001|72|EGY
Mahmoud Hamdy|CB|1995|71|EGY
Omar Gaber|RB|1992|69|EGY
Ahmed Fotouh|LB|1998|71|EGY
Nabil Dunga|DM|1992|71|EGY
Mohamed Shehata|CM|1999|71|EGY
Abdallah El Said|AM|1985|70|EGY||K
Nasser Maher|AM|1997|71|EGY
Seifeddine Jaziri|ST|1993|71|TUN
Nasser Mansi|ST|1996|71|EGY`,
"Pyramids FC": `Ahmed El Shenawy|GK|1991|72|EGY
Mohamed Chibi|RB|1993|71|MAR
Mohanad Lasheen|DM|1996|71|EGY
Blati Touré|CM|1994|72|BFA
Walid El Karti|AM|1994|71|MAR
Ramadan Sobhi|LW|1997|73|EGY
Ibrahim Adel|RW|2001|73|EGY|79
Mostafa Fathi|RW|1994|72|EGY
Fiston Mayele|ST|1994|73|COD`,
"Mamelodi Sundowns": `Ronwen Williams|GK|1992|74|RSA
Khuliso Mudau|RB|1995|71|RSA
Aubrey Modiba|LB|1995|72|RSA
Teboho Mokoena|CM|1997|73|RSA
Marcelo Allende|CM|1999|72|CHI
Themba Zwane|AM|1989|70|RSA
Lucas Ribeiro|LW|1999|73|BRA
Iqraam Rayners|ST|1995|72|RSA`,
"Orlando Pirates": `Nkosinathi Sibisi|CB|1995|71|RSA
Patrick Maswanganyi|AM|1998|72|RSA
Relebohile Mofokeng|LW|2004|72|RSA|83
Tshegofatso Mabasa|ST|1996|70|RSA`,
};
