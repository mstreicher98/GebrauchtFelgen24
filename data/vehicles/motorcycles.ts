import { make, moto, type MakeDef } from "./types";

/*
 * Start-Datensatz Motorräder. Angaben ohne Gewähr – siehe README.md.
 * Motorradfelgen passen in der Regel nur modellspezifisch (Achse, Bremsscheiben, Kettenrad).
 * moto(Name, Baujahr von, bis, ["V <Breite>x<Zoll> <Reifen>", "H ..."])
 */

export const motorcycles: MakeDef[] = [
  make("BMW Motorrad", "motorrad", {
    "R 1250 GS": [moto("R 1250 GS", 2018, 2023, ["V 3.00x19 120/70 R19", "H 4.50x17 170/60 R17"])],
    "R 1300 GS": [moto("R 1300 GS", 2023, null, ["V 3.00x19 120/70 R19", "H 4.50x17 170/60 R17"])],
    "R 1250 RT": [moto("R 1250 RT", 2019, 2024, ["V 3.50x17 120/70 ZR17", "H 5.50x17 180/55 ZR17"])],
    "R nineT": [moto("R nineT", 2014, null, ["V 3.50x17 120/70 ZR17", "H 5.50x17 180/55 ZR17"])],
    "S 1000 RR": [moto("S 1000 RR (K67)", 2019, null, ["V 3.50x17 120/70 ZR17", "H 6.00x17 190/55 ZR17"])],
    "F 900 R": [moto("F 900 R", 2020, null, ["V 3.50x17 120/70 ZR17", "H 5.50x17 180/55 ZR17"])],
    "F 850 GS": [moto("F 850 GS", 2018, 2023, ["V 2.15x21 90/90-21", "H 4.25x17 150/70 R17"])],
    "F 750 GS": [moto("F 750 GS", 2018, 2023, ["V 2.50x19 110/80 R19", "H 4.25x17 150/70 R17"])],
    "G 310 R": [moto("G 310 R", 2016, null, ["V 3.00x17 110/70 R17", "H 4.00x17 150/60 R17"])],
  }),

  make("KTM", "motorrad", {
    "125 Duke": [moto("125 Duke", 2017, 2023, ["V 3.00x17 110/70 R17", "H 4.00x17 150/60 R17"])],
    "390 Duke": [moto("390 Duke", 2017, 2023, ["V 3.00x17 110/70 R17", "H 4.00x17 150/60 R17"])],
    "790 / 890 Duke": [moto("790 / 890 Duke", 2018, null, ["V 3.50x17 120/70 ZR17", "H 5.50x17 180/55 ZR17"])],
    "1290 Super Duke R": [moto("1290 Super Duke R", 2014, null, ["V 3.50x17 120/70 ZR17", "H 6.00x17 200/55 ZR17"])],
    "890 Adventure": [moto("890 Adventure", 2021, null, ["V 2.50x21 90/90-21", "H 4.50x18 150/70 R18"])],
    "1290 Super Adventure S": [moto("1290 Super Adventure S", 2021, null, ["V 3.50x19 120/70 R19", "H 5.00x17 170/60 R17"])],
  }),

  make("Husqvarna", "motorrad", {
    "Svartpilen / Vitpilen 401": [moto("Svartpilen / Vitpilen 401", 2018, 2023, ["V 3.00x17 110/70 R17", "H 4.00x17 150/60 R17"])],
  }),

  make("Honda", "motorrad", {
    "CB500F": [moto("CB500F", 2013, null, ["V 3.50x17 120/70 ZR17", "H 4.50x17 160/60 ZR17"])],
    "CB500X / NX500": [moto("CB500X / NX500", 2019, null, ["V 2.50x19 110/80 R19", "H 4.50x17 160/60 R17"])],
    "CB650R / CBR650R": [moto("CB650R / CBR650R", 2019, null, ["V 3.50x17 120/70 ZR17", "H 5.50x17 180/55 ZR17"])],
    "CB1000R": [moto("CB1000R", 2018, null, ["V 3.50x17 120/70 ZR17", "H 6.00x17 190/55 ZR17"])],
    "NC750X": [moto("NC750X", 2014, null, ["V 3.50x17 120/70 ZR17", "H 4.50x17 160/60 ZR17"])],
    "CRF1100L Africa Twin": [moto("CRF1100L Africa Twin", 2020, null, ["V 2.15x21 90/90-21", "H 4.00x18 150/70 R18"])],
    "Rebel 500": [moto("CMX500 Rebel", 2017, null, ["V 3.00x16 130/90-16", "H 3.50x16 150/80-16"])],
    "Gold Wing": [moto("GL1800 Gold Wing", 2018, null, ["V 3.50x18 130/70 R18", "H 5.00x16 200/55 R16"])],
    "PCX 125": [moto("PCX 125", 2021, null, ["V 14 110/70-14", "H 13 130/70-13"])],
  }),

  make("Yamaha", "motorrad", {
    "MT-07": [moto("MT-07", 2014, null, ["V 3.50x17 120/70 ZR17", "H 5.50x17 180/55 ZR17"])],
    "MT-09": [moto("MT-09", 2013, null, ["V 3.50x17 120/70 ZR17", "H 5.50x17 180/55 ZR17"])],
    "MT-125": [moto("MT-125", 2020, null, ["V 2.75x17 100/80-17", "H 4.00x17 140/70-17"])],
    "Tracer 9": [moto("Tracer 9", 2021, null, ["V 3.50x17 120/70 ZR17", "H 5.50x17 180/55 ZR17"])],
    "XSR700": [moto("XSR700", 2016, null, ["V 3.50x17 120/70 ZR17", "H 5.50x17 180/55 ZR17"])],
    "YZF-R7": [moto("YZF-R7", 2021, null, ["V 3.50x17 120/70 ZR17", "H 5.50x17 180/55 ZR17"])],
    "YZF-R1": [moto("YZF-R1", 2015, null, ["V 3.50x17 120/70 ZR17", "H 6.00x17 190/55 ZR17"])],
    "Ténéré 700": [moto("Ténéré 700", 2019, null, ["V 2.15x21 90/90-21", "H 4.25x18 150/70 R18"])],
    "TMAX": [moto("TMAX 530/560", 2017, null, ["V 3.50x15 120/70 R15", "H 4.50x15 160/60 R15"])],
    "XMAX 300": [moto("XMAX 300", 2017, null, ["V 15 120/70-15", "H 14 140/70-14"])],
  }),

  make("Kawasaki", "motorrad", {
    "Z400 / Ninja 400": [moto("Z400 / Ninja 400", 2018, null, ["V 2.75x17 110/70-17", "H 4.00x17 150/60-17"])],
    "Z650 / Ninja 650": [moto("Z650 / Ninja 650", 2017, null, ["V 3.50x17 120/70 ZR17", "H 4.50x17 160/60 ZR17"])],
    "Versys 650": [moto("Versys 650", 2015, null, ["V 3.50x17 120/70 ZR17", "H 4.50x17 160/60 ZR17"])],
    Z900: [moto("Z900", 2017, null, ["V 3.50x17 120/70 ZR17", "H 5.50x17 180/55 ZR17"])],
    "Z H2": [moto("Z H2", 2020, null, ["V 3.50x17 120/70 ZR17", "H 6.00x17 190/55 ZR17"])],
    "Ninja ZX-10R": [moto("Ninja ZX-10R", 2016, null, ["V 3.50x17 120/70 ZR17", "H 6.00x17 190/55 ZR17"])],
  }),

  make("Suzuki", "motorrad", {
    SV650: [moto("SV650", 2016, null, ["V 3.50x17 120/70 ZR17", "H 4.50x17 160/60 ZR17"])],
    "GSX-S750": [moto("GSX-S750", 2017, 2021, ["V 3.50x17 120/70 ZR17", "H 5.50x17 180/55 ZR17"])],
    "GSX-S1000": [moto("GSX-S1000", 2021, null, ["V 3.50x17 120/70 ZR17", "H 6.00x17 190/50 ZR17"])],
    "GSX-R1000": [moto("GSX-R1000", 2017, null, ["V 3.50x17 120/70 ZR17", "H 6.00x17 190/55 ZR17"])],
    Hayabusa: [moto("Hayabusa", 2021, null, ["V 3.50x17 120/70 ZR17", "H 6.00x17 190/50 ZR17"])],
    "V-Strom 650": [moto("V-Strom 650", 2017, 2023, ["V 2.50x19 110/80 R19", "H 4.00x17 150/70 R17"])],
  }),

  make("Ducati", "motorrad", {
    Monster: [moto("Monster (937)", 2021, null, ["V 3.50x17 120/70 ZR17", "H 5.50x17 180/55 ZR17"])],
    "Scrambler Icon": [moto("Scrambler Icon", 2015, null, ["V 3.00x18 110/80 R18", "H 5.50x17 180/55 R17"])],
    "Panigale V4": [moto("Panigale V4", 2018, null, ["V 3.50x17 120/70 ZR17", "H 6.00x17 200/60 ZR17"])],
    "Streetfighter V4": [moto("Streetfighter V4", 2020, null, ["V 3.50x17 120/70 ZR17", "H 6.00x17 200/60 ZR17"])],
    "Multistrada V4": [moto("Multistrada V4", 2021, null, ["V 3.00x19 120/70 ZR19", "H 4.50x17 170/60 ZR17"])],
    "Diavel V4": [moto("Diavel V4", 2023, null, ["V 3.50x17 120/70 ZR17", "H 8.00x17 240/45 ZR17"])],
  }),

  make("Triumph", "motorrad", {
    "Trident 660": [moto("Trident 660", 2021, null, ["V 3.50x17 120/70 ZR17", "H 5.50x17 180/55 ZR17"])],
    "Street Triple 765": [moto("Street Triple 765", 2017, null, ["V 3.50x17 120/70 ZR17", "H 5.50x17 180/55 ZR17"])],
    "Tiger 900 GT": [moto("Tiger 900 GT", 2020, null, ["V 2.50x19 100/90-19", "H 4.25x17 150/70 R17"])],
    "Tiger 900 Rally": [moto("Tiger 900 Rally", 2020, null, ["V 2.15x21 90/90-21", "H 4.25x17 150/70 R17"])],
    "Bonneville T120": [moto("Bonneville T120", 2016, null, ["V 2.75x18 100/90-18", "H 4.25x17 150/70 R17"])],
  }),

  make("Aprilia", "motorrad", {
    "RS 660 / Tuono 660": [moto("RS 660 / Tuono 660", 2020, null, ["V 3.50x17 120/70 ZR17", "H 5.50x17 180/55 ZR17"])],
    "Tuono V4": [moto("Tuono V4", 2021, null, ["V 3.50x17 120/70 ZR17", "H 6.00x17 200/55 ZR17"])],
  }),

  make("Harley-Davidson", "motorrad", {
    "Street Bob 114": [moto("Street Bob 114 (Softail M8)", 2018, null, ["V 19 100/90-19", "H 16 150/80B16"])],
    "Fat Boy 114": [moto("Fat Boy 114 (Softail M8)", 2018, null, ["V 18 160/60 R18", "H 18 240/40 R18"])],
    "Sportster S": [moto("Sportster S (RH1250S)", 2021, null, ["V 17 160/70 R17", "H 16 180/70 R16"])],
    "Road Glide": [moto("Road Glide", 2017, 2023, ["V 19 130/60B19", "H 18 180/55B18"])],
    "Pan America": [moto("Pan America 1250", 2021, null, ["V 19 120/70 R19", "H 18 170/60 R18"])],
  }),

  make("Vespa", "motorrad", {
    "GTS 300": [moto("GTS 300", 2019, null, ["V 12 120/70-12", "H 12 130/70-12"])],
  }),
];
