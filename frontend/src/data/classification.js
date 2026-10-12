// ADWITIX Master Classification Framework — sourced from the
// "ADWITIX Master Classification" reference doc: 8 CATs, the single
// universal 104-item SUBCAT master, and the 150-item MICROCAT master.
// SUBCAT and MICROCAT are separate flat masters in the source doc with
// no explicit parent-child column; MICROCATS_BY_SUBCAT below bridges
// them by micro-group, calibrated against the doc's own two worked
// examples (SUB-25 E-Scrap/E-Waste -> MICRO-52 Computer Scrap; SUB-39
// Paper, Cardboard & Paper Products -> MICRO-69 OCC).

export const CATEGORIES = [
  { id: 'cat-01', code: 'CAT-01', label: 'Salvaged Claims Goods' },
  { id: 'cat-02', code: 'CAT-02', label: 'Second-Hand / Used Goods' },
  { id: 'cat-03', code: 'CAT-03', label: 'Abandoned Goods' },
  { id: 'cat-04', code: 'CAT-04', label: 'Antiques & Collectibles' },
  { id: 'cat-05', code: 'CAT-05', label: 'Repossessed Banking / Financed Assets' },
  { id: 'cat-06', code: 'CAT-06', label: 'Industrial / Commercial Surplus' },
  { id: 'cat-07', code: 'CAT-07', label: 'Customs / Confiscated Goods' },
  { id: 'cat-08', code: 'CAT-08', label: 'Lost-and-Found Inventories' },
];

export const SUBCATEGORIES = [
  { id: 'sub-01', code: 'SUB-01', label: 'Vehicles & Automotive', group: 'Vehicles & Mobility' },
  { id: 'sub-02', code: 'SUB-02', label: 'Two-Wheelers', group: 'Vehicles & Mobility' },
  { id: 'sub-03', code: 'SUB-03', label: 'Commercial & Heavy Vehicles', group: 'Vehicles & Mobility' },
  { id: 'sub-04', code: 'SUB-04', label: 'Automotive Parts & Components', group: 'Vehicles & Mobility' },
  { id: 'sub-05', code: 'SUB-05', label: 'Tyres & Tubes', group: 'Vehicles & Mobility' },
  { id: 'sub-06', code: 'SUB-06', label: 'Machinery & Plant', group: 'Machinery & Equipment' },
  { id: 'sub-07', code: 'SUB-07', label: 'Machine Tools', group: 'Machinery & Equipment' },
  { id: 'sub-08', code: 'SUB-08', label: 'Construction Equipment', group: 'Machinery & Equipment' },
  { id: 'sub-09', code: 'SUB-09', label: 'Agricultural Equipment', group: 'Machinery & Equipment' },
  { id: 'sub-10', code: 'SUB-10', label: 'Material Handling Equipment', group: 'Machinery & Equipment' },
  { id: 'sub-11', code: 'SUB-11', label: 'Industrial Equipment', group: 'Machinery & Equipment' },
  { id: 'sub-12', code: 'SUB-12', label: 'Production & Process Equipment', group: 'Machinery & Equipment' },
  { id: 'sub-13', code: 'SUB-13', label: 'Pumps, Motors & Compressors', group: 'Machinery & Equipment' },
  { id: 'sub-14', code: 'SUB-14', label: 'Generators & Power Equipment', group: 'Machinery & Equipment' },
  { id: 'sub-15', code: 'SUB-15', label: 'HVAC & Refrigeration Equipment', group: 'Machinery & Equipment' },
  { id: 'sub-16', code: 'SUB-16', label: 'Tools & Workshop Equipment', group: 'Machinery & Equipment' },
  { id: 'sub-17', code: 'SUB-17', label: 'Laboratory Equipment', group: 'Machinery & Equipment' },
  { id: 'sub-18', code: 'SUB-18', label: 'Medical Equipment & Devices', group: 'Machinery & Equipment' },
  { id: 'sub-19', code: 'SUB-19', label: 'Office & Commercial Equipment', group: 'Machinery & Equipment' },
  { id: 'sub-20', code: 'SUB-20', label: 'Furniture & Fixtures', group: 'Machinery & Equipment' },
  { id: 'sub-21', code: 'SUB-21', label: 'Electrical & Electronic Equipment', group: 'Electrical, Electronic & Digital' },
  { id: 'sub-22', code: 'SUB-22', label: 'Electrical Scrap, Cables & Wires', group: 'Electrical, Electronic & Digital' },
  { id: 'sub-23', code: 'SUB-23', label: 'Transformers, Switchgear & Power Equipment', group: 'Electrical, Electronic & Digital' },
  { id: 'sub-24', code: 'SUB-24', label: 'Motors, Alternators & Electrical Components', group: 'Electrical, Electronic & Digital' },
  { id: 'sub-25', code: 'SUB-25', label: 'E-Scrap / E-Waste', group: 'Electrical, Electronic & Digital' },
  { id: 'sub-26', code: 'SUB-26', label: 'IT & Telecom Equipment', group: 'Electrical, Electronic & Digital' },
  { id: 'sub-27', code: 'SUB-27', label: 'Computer & IT Scrap', group: 'Electrical, Electronic & Digital' },
  { id: 'sub-28', code: 'SUB-28', label: 'Mobile & Telecom Scrap', group: 'Electrical, Electronic & Digital' },
  { id: 'sub-29', code: 'SUB-29', label: 'Electronic Components & PCBs', group: 'Electrical, Electronic & Digital' },
  { id: 'sub-30', code: 'SUB-30', label: 'Consumer Electronics', group: 'Electrical, Electronic & Digital' },
  { id: 'sub-31', code: 'SUB-31', label: 'Batteries & Battery Scrap', group: 'Batteries & Energy' },
  { id: 'sub-32', code: 'SUB-32', label: 'Solar & Renewable Energy Equipment', group: 'Batteries & Energy' },
  { id: 'sub-33', code: 'SUB-33', label: 'Energy Storage Equipment', group: 'Batteries & Energy' },
  { id: 'sub-34', code: 'SUB-34', label: 'Metal Scrap & Metal Products', group: 'Metals & Minerals' },
  { id: 'sub-35', code: 'SUB-35', label: 'Ferrous Metals', group: 'Metals & Minerals' },
  { id: 'sub-36', code: 'SUB-36', label: 'Non-Ferrous Metals', group: 'Metals & Minerals' },
  { id: 'sub-37', code: 'SUB-37', label: 'Precious Metals & Precious Metal Articles', group: 'Metals & Minerals' },
  { id: 'sub-38', code: 'SUB-38', label: 'Minerals & Industrial Minerals', group: 'Metals & Minerals' },
  { id: 'sub-39', code: 'SUB-39', label: 'Paper, Cardboard & Paper Products', group: 'Paper, Plastic & Other Materials' },
  { id: 'sub-40', code: 'SUB-40', label: 'Plastic & Plastic Scrap', group: 'Paper, Plastic & Other Materials' },
  { id: 'sub-41', code: 'SUB-41', label: 'Rubber & Rubber Products', group: 'Paper, Plastic & Other Materials' },
  { id: 'sub-42', code: 'SUB-42', label: 'Glass & Glass Products', group: 'Paper, Plastic & Other Materials' },
  { id: 'sub-43', code: 'SUB-43', label: 'Wood & Timber Products', group: 'Paper, Plastic & Other Materials' },
  { id: 'sub-44', code: 'SUB-44', label: 'Textiles, Fabrics & Garments', group: 'Paper, Plastic & Other Materials' },
  { id: 'sub-45', code: 'SUB-45', label: 'Leather & Leather Products', group: 'Paper, Plastic & Other Materials' },
  { id: 'sub-46', code: 'SUB-46', label: 'Carpets, Rugs & Furnishings', group: 'Paper, Plastic & Other Materials' },
  { id: 'sub-47', code: 'SUB-47', label: 'Food & Food Products', group: 'Food & Agricultural' },
  { id: 'sub-48', code: 'SUB-48', label: 'Beverages & Consumables', group: 'Food & Agricultural' },
  { id: 'sub-49', code: 'SUB-49', label: 'Agricultural Produce & Commodities', group: 'Food & Agricultural' },
  { id: 'sub-50', code: 'SUB-50', label: 'Seeds, Feed & Agricultural Inputs', group: 'Food & Agricultural' },
  { id: 'sub-51', code: 'SUB-51', label: 'Food Processing Products & Equipment', group: 'Food & Agricultural' },
  { id: 'sub-52', code: 'SUB-52', label: 'Chemicals & Chemical Products', group: 'Chemicals & Specialised Materials' },
  { id: 'sub-53', code: 'SUB-53', label: 'Oils, Lubricants & Industrial Fluids', group: 'Chemicals & Specialised Materials' },
  { id: 'sub-54', code: 'SUB-54', label: 'Paints, Coatings & Adhesives', group: 'Chemicals & Specialised Materials' },
  { id: 'sub-55', code: 'SUB-55', label: 'Pharmaceuticals & Healthcare Products', group: 'Chemicals & Specialised Materials' },
  { id: 'sub-56', code: 'SUB-56', label: 'Cleaning & Industrial Consumables', group: 'Chemicals & Specialised Materials' },
  { id: 'sub-57', code: 'SUB-57', label: 'Industrial Raw Materials', group: 'Chemicals & Specialised Materials' },
  { id: 'sub-58', code: 'SUB-58', label: 'Building & Construction Materials', group: 'Chemicals & Specialised Materials' },
  { id: 'sub-59', code: 'SUB-59', label: 'Components & Spare Parts', group: 'Inventory & Commercial Goods' },
  { id: 'sub-60', code: 'SUB-60', label: 'MRO Materials & Consumables', group: 'Inventory & Commercial Goods' },
  { id: 'sub-61', code: 'SUB-61', label: 'Packaging Materials', group: 'Inventory & Commercial Goods' },
  { id: 'sub-62', code: 'SUB-62', label: 'Finished Goods & Consumer Products', group: 'Inventory & Commercial Goods' },
  { id: 'sub-63', code: 'SUB-63', label: 'Excess & Obsolete Inventory', group: 'Inventory & Commercial Goods' },
  { id: 'sub-64', code: 'SUB-64', label: 'Commercial Stock & Inventory', group: 'Inventory & Commercial Goods' },
  { id: 'sub-65', code: 'SUB-65', label: 'General Merchandise', group: 'Inventory & Commercial Goods' },
  { id: 'sub-66', code: 'SUB-66', label: 'Antiques & Vintage Goods', group: 'Antiques & Collectibles' },
  { id: 'sub-67', code: 'SUB-67', label: 'Art & Paintings', group: 'Antiques & Collectibles' },
  { id: 'sub-68', code: 'SUB-68', label: 'Sculptures & Decorative Objects', group: 'Antiques & Collectibles' },
  { id: 'sub-69', code: 'SUB-69', label: 'Coins, Currency & Medals', group: 'Antiques & Collectibles' },
  { id: 'sub-70', code: 'SUB-70', label: 'Jewellery & Precious Articles', group: 'Antiques & Collectibles' },
  { id: 'sub-71', code: 'SUB-71', label: 'Watches & Clocks', group: 'Antiques & Collectibles' },
  { id: 'sub-72', code: 'SUB-72', label: 'Books, Manuscripts & Documents', group: 'Antiques & Collectibles' },
  { id: 'sub-73', code: 'SUB-73', label: 'Collectibles & Memorabilia', group: 'Antiques & Collectibles' },
  { id: 'sub-74', code: 'SUB-74', label: 'Historical & Heritage Objects', group: 'Antiques & Collectibles' },
  { id: 'sub-75', code: 'SUB-75', label: 'Traditional Crafts & Cultural Objects', group: 'Antiques & Collectibles' },
  { id: 'sub-76', code: 'SUB-76', label: 'Vintage Machinery & Equipment', group: 'Antiques & Collectibles' },
  { id: 'sub-77', code: 'SUB-77', label: 'Residential Contents', group: 'Property Contents & Personal Effects' },
  { id: 'sub-78', code: 'SUB-78', label: 'Commercial Contents', group: 'Property Contents & Personal Effects' },
  { id: 'sub-79', code: 'SUB-79', label: 'Industrial Contents', group: 'Property Contents & Personal Effects' },
  { id: 'sub-80', code: 'SUB-80', label: 'Personal Effects', group: 'Property Contents & Personal Effects' },
  { id: 'sub-81', code: 'SUB-81', label: 'Bags & Luggage', group: 'Property Contents & Personal Effects' },
  { id: 'sub-82', code: 'SUB-82', label: 'Clothing & Personal Items', group: 'Property Contents & Personal Effects' },
  { id: 'sub-83', code: 'SUB-83', label: 'Lost Documents & Identification', group: 'Property Contents & Personal Effects' },
  { id: 'sub-84', code: 'SUB-84', label: 'Lost Property & Miscellaneous Articles', group: 'Property Contents & Personal Effects' },
  { id: 'sub-85', code: 'SUB-85', label: 'Mixed Metal Scrap', group: 'Scrap, Waste & Recovery' },
  { id: 'sub-86', code: 'SUB-86', label: 'Mixed Electrical Scrap', group: 'Scrap, Waste & Recovery' },
  { id: 'sub-87', code: 'SUB-87', label: 'Mixed E-Scrap / E-Waste', group: 'Scrap, Waste & Recovery' },
  { id: 'sub-88', code: 'SUB-88', label: 'Mixed Plastic Scrap', group: 'Scrap, Waste & Recovery' },
  { id: 'sub-89', code: 'SUB-89', label: 'Mixed Paper & Packaging Waste', group: 'Scrap, Waste & Recovery' },
  { id: 'sub-90', code: 'SUB-90', label: 'Industrial Scrap & Waste', group: 'Scrap, Waste & Recovery' },
  { id: 'sub-91', code: 'SUB-91', label: 'Recyclable Materials', group: 'Scrap, Waste & Recovery' },
  { id: 'sub-92', code: 'SUB-92', label: 'Recovered Materials', group: 'Scrap, Waste & Recovery' },
  { id: 'sub-93', code: 'SUB-93', label: 'Mixed / Assorted Lots', group: 'Scrap, Waste & Recovery' },
  { id: 'sub-94', code: 'SUB-94', label: 'Customs / Imported Goods', group: 'Special Institutional Material' },
  { id: 'sub-95', code: 'SUB-95', label: 'Confiscated Goods', group: 'Special Institutional Material' },
  { id: 'sub-96', code: 'SUB-96', label: 'Seized / Forfeited Goods', group: 'Special Institutional Material' },
  { id: 'sub-97', code: 'SUB-97', label: 'Abandoned Cargo', group: 'Special Institutional Material' },
  { id: 'sub-98', code: 'SUB-98', label: 'Unclaimed Cargo & Shipments', group: 'Special Institutional Material' },
  { id: 'sub-99', code: 'SUB-99', label: 'Repossessed Business Assets', group: 'Special Institutional Material' },
  { id: 'sub-100', code: 'SUB-100', label: 'Repossessed Inventory & Stock', group: 'Special Institutional Material' },
  { id: 'sub-101', code: 'SUB-101', label: 'Other Goods', group: 'Other' },
  { id: 'sub-102', code: 'SUB-102', label: 'Other Equipment', group: 'Other' },
  { id: 'sub-103', code: 'SUB-103', label: 'Other Materials', group: 'Other' },
  { id: 'sub-104', code: 'SUB-104', label: 'Other Assets', group: 'Other' },
];

export const MICROCATEGORIES = [
  { id: 'micro-01', code: 'MICRO-01', label: 'Passenger Cars', group: 'Vehicles & Automotive' },
  { id: 'micro-02', code: 'MICRO-02', label: 'SUVs', group: 'Vehicles & Automotive' },
  { id: 'micro-03', code: 'MICRO-03', label: 'Motorcycles', group: 'Vehicles & Automotive' },
  { id: 'micro-04', code: 'MICRO-04', label: 'Scooters', group: 'Vehicles & Automotive' },
  { id: 'micro-05', code: 'MICRO-05', label: 'Commercial Trucks', group: 'Vehicles & Automotive' },
  { id: 'micro-06', code: 'MICRO-06', label: 'Buses', group: 'Vehicles & Automotive' },
  { id: 'micro-07', code: 'MICRO-07', label: 'Trailers', group: 'Vehicles & Automotive' },
  { id: 'micro-08', code: 'MICRO-08', label: 'Construction Vehicles', group: 'Vehicles & Automotive' },
  { id: 'micro-09', code: 'MICRO-09', label: 'Agricultural Vehicles', group: 'Vehicles & Automotive' },
  { id: 'micro-10', code: 'MICRO-10', label: 'Auto Parts', group: 'Vehicles & Automotive' },
  { id: 'micro-11', code: 'MICRO-11', label: 'Engines & Gearboxes', group: 'Vehicles & Automotive' },
  { id: 'micro-12', code: 'MICRO-12', label: 'Tyres', group: 'Vehicles & Automotive' },
  { id: 'micro-13', code: 'MICRO-13', label: 'Automotive Batteries', group: 'Vehicles & Automotive' },
  { id: 'micro-14', code: 'MICRO-14', label: 'CNC Machines', group: 'Machinery' },
  { id: 'micro-15', code: 'MICRO-15', label: 'Conventional Machine Tools', group: 'Machinery' },
  { id: 'micro-16', code: 'MICRO-16', label: 'Lathes', group: 'Machinery' },
  { id: 'micro-17', code: 'MICRO-17', label: 'Milling Machines', group: 'Machinery' },
  { id: 'micro-18', code: 'MICRO-18', label: 'Presses', group: 'Machinery' },
  { id: 'micro-19', code: 'MICRO-19', label: 'Fabrication Equipment', group: 'Machinery' },
  { id: 'micro-20', code: 'MICRO-20', label: 'Packaging Machinery', group: 'Machinery' },
  { id: 'micro-21', code: 'MICRO-21', label: 'Textile Machinery', group: 'Machinery' },
  { id: 'micro-22', code: 'MICRO-22', label: 'Food Processing Machinery', group: 'Machinery' },
  { id: 'micro-23', code: 'MICRO-23', label: 'Printing Machinery', group: 'Machinery' },
  { id: 'micro-24', code: 'MICRO-24', label: 'Pumps', group: 'Machinery' },
  { id: 'micro-25', code: 'MICRO-25', label: 'Compressors', group: 'Machinery' },
  { id: 'micro-26', code: 'MICRO-26', label: 'Motors', group: 'Machinery' },
  { id: 'micro-27', code: 'MICRO-27', label: 'Generators', group: 'Machinery' },
  { id: 'micro-28', code: 'MICRO-28', label: 'Forklifts', group: 'Machinery' },
  { id: 'micro-29', code: 'MICRO-29', label: 'Cranes & Hoists', group: 'Machinery' },
  { id: 'micro-30', code: 'MICRO-30', label: 'Earthmoving Equipment', group: 'Machinery' },
  { id: 'micro-31', code: 'MICRO-31', label: 'Agricultural Machinery', group: 'Machinery' },
  { id: 'micro-32', code: 'MICRO-32', label: 'Copper Cables', group: 'Electrical & Electronic' },
  { id: 'micro-33', code: 'MICRO-33', label: 'Aluminium Cables', group: 'Electrical & Electronic' },
  { id: 'micro-34', code: 'MICRO-34', label: 'Armoured Cables', group: 'Electrical & Electronic' },
  { id: 'micro-35', code: 'MICRO-35', label: 'Transformers', group: 'Electrical & Electronic' },
  { id: 'micro-36', code: 'MICRO-36', label: 'Switchgear', group: 'Electrical & Electronic' },
  { id: 'micro-37', code: 'MICRO-37', label: 'Electrical Panels', group: 'Electrical & Electronic' },
  { id: 'micro-38', code: 'MICRO-38', label: 'Motors', group: 'Electrical & Electronic' },
  { id: 'micro-39', code: 'MICRO-39', label: 'Alternators', group: 'Electrical & Electronic' },
  { id: 'micro-40', code: 'MICRO-40', label: 'Printed Circuit Boards', group: 'Electrical & Electronic' },
  { id: 'micro-41', code: 'MICRO-41', label: 'Computers', group: 'Electrical & Electronic' },
  { id: 'micro-42', code: 'MICRO-42', label: 'Servers', group: 'Electrical & Electronic' },
  { id: 'micro-43', code: 'MICRO-43', label: 'Networking Equipment', group: 'Electrical & Electronic' },
  { id: 'micro-44', code: 'MICRO-44', label: 'Mobile Phones', group: 'Electrical & Electronic' },
  { id: 'micro-45', code: 'MICRO-45', label: 'Telecom Equipment', group: 'Electrical & Electronic' },
  { id: 'micro-46', code: 'MICRO-46', label: 'Electronic Components', group: 'Electrical & Electronic' },
  { id: 'micro-47', code: 'MICRO-47', label: 'Lead-Acid Batteries', group: 'Batteries & E-Scrap' },
  { id: 'micro-48', code: 'MICRO-48', label: 'Lithium-Ion Batteries', group: 'Batteries & E-Scrap' },
  { id: 'micro-49', code: 'MICRO-49', label: 'Industrial Batteries', group: 'Batteries & E-Scrap' },
  { id: 'micro-50', code: 'MICRO-50', label: 'Automotive Batteries', group: 'Batteries & E-Scrap' },
  { id: 'micro-51', code: 'MICRO-51', label: 'Battery Scrap', group: 'Batteries & E-Scrap' },
  { id: 'micro-52', code: 'MICRO-52', label: 'Computer Scrap', group: 'Batteries & E-Scrap' },
  { id: 'micro-53', code: 'MICRO-53', label: 'Mobile Phone Scrap', group: 'Batteries & E-Scrap' },
  { id: 'micro-54', code: 'MICRO-54', label: 'PCB Scrap', group: 'Batteries & E-Scrap' },
  { id: 'micro-55', code: 'MICRO-55', label: 'Mixed E-Waste', group: 'Batteries & E-Scrap' },
  { id: 'micro-56', code: 'MICRO-56', label: 'Electronic Components Scrap', group: 'Batteries & E-Scrap' },
  { id: 'micro-57', code: 'MICRO-57', label: 'Mild Steel Scrap', group: 'Metals' },
  { id: 'micro-58', code: 'MICRO-58', label: 'Stainless Steel Scrap', group: 'Metals' },
  { id: 'micro-59', code: 'MICRO-59', label: 'Cast Iron Scrap', group: 'Metals' },
  { id: 'micro-60', code: 'MICRO-60', label: 'Aluminium Scrap', group: 'Metals' },
  { id: 'micro-61', code: 'MICRO-61', label: 'Copper Scrap', group: 'Metals' },
  { id: 'micro-62', code: 'MICRO-62', label: 'Brass Scrap', group: 'Metals' },
  { id: 'micro-63', code: 'MICRO-63', label: 'Bronze Scrap', group: 'Metals' },
  { id: 'micro-64', code: 'MICRO-64', label: 'Zinc Scrap', group: 'Metals' },
  { id: 'micro-65', code: 'MICRO-65', label: 'Lead Scrap', group: 'Metals' },
  { id: 'micro-66', code: 'MICRO-66', label: 'Mixed Non-Ferrous Scrap', group: 'Metals' },
  { id: 'micro-67', code: 'MICRO-67', label: 'Metal Turnings', group: 'Metals' },
  { id: 'micro-68', code: 'MICRO-68', label: 'Metal Components', group: 'Metals' },
  { id: 'micro-69', code: 'MICRO-69', label: 'OCC', group: 'Paper' },
  { id: 'micro-70', code: 'MICRO-70', label: 'Kraft Paper', group: 'Paper' },
  { id: 'micro-71', code: 'MICRO-71', label: 'Newspaper', group: 'Paper' },
  { id: 'micro-72', code: 'MICRO-72', label: 'Office Paper', group: 'Paper' },
  { id: 'micro-73', code: 'MICRO-73', label: 'Duplex Board', group: 'Paper' },
  { id: 'micro-74', code: 'MICRO-74', label: 'Corrugated Sheets', group: 'Paper' },
  { id: 'micro-75', code: 'MICRO-75', label: 'Mixed Paper', group: 'Paper' },
  { id: 'micro-76', code: 'MICRO-76', label: 'Paper Rolls', group: 'Paper' },
  { id: 'micro-77', code: 'MICRO-77', label: 'PET', group: 'Plastics & Rubber' },
  { id: 'micro-78', code: 'MICRO-78', label: 'HDPE', group: 'Plastics & Rubber' },
  { id: 'micro-79', code: 'MICRO-79', label: 'LDPE', group: 'Plastics & Rubber' },
  { id: 'micro-80', code: 'MICRO-80', label: 'PP', group: 'Plastics & Rubber' },
  { id: 'micro-81', code: 'MICRO-81', label: 'PVC', group: 'Plastics & Rubber' },
  { id: 'micro-82', code: 'MICRO-82', label: 'ABS', group: 'Plastics & Rubber' },
  { id: 'micro-83', code: 'MICRO-83', label: 'Mixed Plastic', group: 'Plastics & Rubber' },
  { id: 'micro-84', code: 'MICRO-84', label: 'Plastic Components', group: 'Plastics & Rubber' },
  { id: 'micro-85', code: 'MICRO-85', label: 'Rubber Scrap', group: 'Plastics & Rubber' },
  { id: 'micro-86', code: 'MICRO-86', label: 'Used Tyres', group: 'Plastics & Rubber' },
  { id: 'micro-87', code: 'MICRO-87', label: 'Grains', group: 'Food & Agricultural' },
  { id: 'micro-88', code: 'MICRO-88', label: 'Pulses', group: 'Food & Agricultural' },
  { id: 'micro-89', code: 'MICRO-89', label: 'Edible Oils', group: 'Food & Agricultural' },
  { id: 'micro-90', code: 'MICRO-90', label: 'Packaged Food', group: 'Food & Agricultural' },
  { id: 'micro-91', code: 'MICRO-91', label: 'Processed Food', group: 'Food & Agricultural' },
  { id: 'micro-92', code: 'MICRO-92', label: 'Beverages', group: 'Food & Agricultural' },
  { id: 'micro-93', code: 'MICRO-93', label: 'Animal Feed', group: 'Food & Agricultural' },
  { id: 'micro-94', code: 'MICRO-94', label: 'Agricultural Produce', group: 'Food & Agricultural' },
  { id: 'micro-95', code: 'MICRO-95', label: 'Seeds', group: 'Food & Agricultural' },
  { id: 'micro-96', code: 'MICRO-96', label: 'Food Processing Residues', group: 'Food & Agricultural' },
  { id: 'micro-97', code: 'MICRO-97', label: 'Industrial Chemicals', group: 'Chemicals & Fluids' },
  { id: 'micro-98', code: 'MICRO-98', label: 'Solvents', group: 'Chemicals & Fluids' },
  { id: 'micro-99', code: 'MICRO-99', label: 'Acids & Alkalis', group: 'Chemicals & Fluids' },
  { id: 'micro-100', code: 'MICRO-100', label: 'Paints & Coatings', group: 'Chemicals & Fluids' },
  { id: 'micro-101', code: 'MICRO-101', label: 'Adhesives', group: 'Chemicals & Fluids' },
  { id: 'micro-102', code: 'MICRO-102', label: 'Lubricants', group: 'Chemicals & Fluids' },
  { id: 'micro-103', code: 'MICRO-103', label: 'Used Oils', group: 'Chemicals & Fluids' },
  { id: 'micro-104', code: 'MICRO-104', label: 'Industrial Fluids', group: 'Chemicals & Fluids' },
  { id: 'micro-105', code: 'MICRO-105', label: 'Chemical Residues', group: 'Chemicals & Fluids' },
  { id: 'micro-106', code: 'MICRO-106', label: 'Cement', group: 'Construction & Materials' },
  { id: 'micro-107', code: 'MICRO-107', label: 'Steel Products', group: 'Construction & Materials' },
  { id: 'micro-108', code: 'MICRO-108', label: 'Pipes & Tubes', group: 'Construction & Materials' },
  { id: 'micro-109', code: 'MICRO-109', label: 'Tiles', group: 'Construction & Materials' },
  { id: 'micro-110', code: 'MICRO-110', label: 'Glass', group: 'Construction & Materials' },
  { id: 'micro-111', code: 'MICRO-111', label: 'Timber', group: 'Construction & Materials' },
  { id: 'micro-112', code: 'MICRO-112', label: 'Bricks & Blocks', group: 'Construction & Materials' },
  { id: 'micro-113', code: 'MICRO-113', label: 'Construction Fixtures', group: 'Construction & Materials' },
  { id: 'micro-114', code: 'MICRO-114', label: 'Insulation Materials', group: 'Construction & Materials' },
  { id: 'micro-115', code: 'MICRO-115', label: 'Fabric', group: 'Textiles & Leather' },
  { id: 'micro-116', code: 'MICRO-116', label: 'Garments', group: 'Textiles & Leather' },
  { id: 'micro-117', code: 'MICRO-117', label: 'Yarn', group: 'Textiles & Leather' },
  { id: 'micro-118', code: 'MICRO-118', label: 'Textile Scrap', group: 'Textiles & Leather' },
  { id: 'micro-119', code: 'MICRO-119', label: 'Leather', group: 'Textiles & Leather' },
  { id: 'micro-120', code: 'MICRO-120', label: 'Leather Products', group: 'Textiles & Leather' },
  { id: 'micro-121', code: 'MICRO-121', label: 'Carpets & Rugs', group: 'Textiles & Leather' },
  { id: 'micro-122', code: 'MICRO-122', label: 'Furniture', group: 'Consumer & Commercial' },
  { id: 'micro-123', code: 'MICRO-123', label: 'Appliances', group: 'Consumer & Commercial' },
  { id: 'micro-124', code: 'MICRO-124', label: 'Office Equipment', group: 'Consumer & Commercial' },
  { id: 'micro-125', code: 'MICRO-125', label: 'Consumer Electronics', group: 'Consumer & Commercial' },
  { id: 'micro-126', code: 'MICRO-126', label: 'Household Goods', group: 'Consumer & Commercial' },
  { id: 'micro-127', code: 'MICRO-127', label: 'Commercial Fixtures', group: 'Consumer & Commercial' },
  { id: 'micro-128', code: 'MICRO-128', label: 'Packaging', group: 'Consumer & Commercial' },
  { id: 'micro-129', code: 'MICRO-129', label: 'General Merchandise', group: 'Consumer & Commercial' },
  { id: 'micro-130', code: 'MICRO-130', label: 'Antique Furniture', group: 'Antiques & Collectibles' },
  { id: 'micro-131', code: 'MICRO-131', label: 'Paintings', group: 'Antiques & Collectibles' },
  { id: 'micro-132', code: 'MICRO-132', label: 'Sculptures', group: 'Antiques & Collectibles' },
  { id: 'micro-133', code: 'MICRO-133', label: 'Coins', group: 'Antiques & Collectibles' },
  { id: 'micro-134', code: 'MICRO-134', label: 'Jewellery', group: 'Antiques & Collectibles' },
  { id: 'micro-135', code: 'MICRO-135', label: 'Watches', group: 'Antiques & Collectibles' },
  { id: 'micro-136', code: 'MICRO-136', label: 'Books & Manuscripts', group: 'Antiques & Collectibles' },
  { id: 'micro-137', code: 'MICRO-137', label: 'Vintage Vehicles', group: 'Antiques & Collectibles' },
  { id: 'micro-138', code: 'MICRO-138', label: 'Vintage Machinery', group: 'Antiques & Collectibles' },
  { id: 'micro-139', code: 'MICRO-139', label: 'Collectibles', group: 'Antiques & Collectibles' },
  { id: 'micro-140', code: 'MICRO-140', label: 'Heritage Objects', group: 'Antiques & Collectibles' },
  { id: 'micro-141', code: 'MICRO-141', label: 'Abandoned Cargo', group: 'Institutional / Special' },
  { id: 'micro-142', code: 'MICRO-142', label: 'Unclaimed Cargo', group: 'Institutional / Special' },
  { id: 'micro-143', code: 'MICRO-143', label: 'Confiscated Vehicles', group: 'Institutional / Special' },
  { id: 'micro-144', code: 'MICRO-144', label: 'Confiscated Goods', group: 'Institutional / Special' },
  { id: 'micro-145', code: 'MICRO-145', label: 'Repossessed Vehicles', group: 'Institutional / Special' },
  { id: 'micro-146', code: 'MICRO-146', label: 'Repossessed Machinery', group: 'Institutional / Special' },
  { id: 'micro-147', code: 'MICRO-147', label: 'Repossessed Inventory', group: 'Institutional / Special' },
  { id: 'micro-148', code: 'MICRO-148', label: 'Lost & Found Electronics', group: 'Institutional / Special' },
  { id: 'micro-149', code: 'MICRO-149', label: 'Lost & Found Personal Effects', group: 'Institutional / Special' },
  { id: 'micro-150', code: 'MICRO-150', label: 'Other Special Assets', group: 'Institutional / Special' },
];

// Every CAT shares the same universal SUBCAT master.
export const SUBCATS_BY_CAT = {};
for (const cat of CATEGORIES) SUBCATS_BY_CAT[cat.id] = SUBCATEGORIES;

const SUB_TO_MICRO_GROUPS = {
  "Vehicles & Automotive": [
    "Vehicles & Automotive"
  ],
  "Two-Wheelers": [
    "Vehicles & Automotive"
  ],
  "Commercial & Heavy Vehicles": [
    "Vehicles & Automotive"
  ],
  "Automotive Parts & Components": [
    "Vehicles & Automotive"
  ],
  "Tyres & Tubes": [
    "Vehicles & Automotive"
  ],
  "Machinery & Plant": [
    "Machinery"
  ],
  "Machine Tools": [
    "Machinery"
  ],
  "Construction Equipment": [
    "Machinery"
  ],
  "Agricultural Equipment": [
    "Machinery"
  ],
  "Material Handling Equipment": [
    "Machinery"
  ],
  "Industrial Equipment": [
    "Machinery"
  ],
  "Production & Process Equipment": [
    "Machinery"
  ],
  "Pumps, Motors & Compressors": [
    "Machinery"
  ],
  "Generators & Power Equipment": [
    "Machinery"
  ],
  "HVAC & Refrigeration Equipment": [
    "Machinery"
  ],
  "Tools & Workshop Equipment": [
    "Machinery"
  ],
  "Electrical & Electronic Equipment": [
    "Electrical & Electronic"
  ],
  "Electrical Scrap, Cables & Wires": [
    "Electrical & Electronic"
  ],
  "Transformers, Switchgear & Power Equipment": [
    "Electrical & Electronic"
  ],
  "Motors, Alternators & Electrical Components": [
    "Electrical & Electronic"
  ],
  "E-Scrap / E-Waste": [
    "Batteries & E-Scrap"
  ],
  "IT & Telecom Equipment": [
    "Batteries & E-Scrap"
  ],
  "Computer & IT Scrap": [
    "Batteries & E-Scrap"
  ],
  "Mobile & Telecom Scrap": [
    "Batteries & E-Scrap"
  ],
  "Electronic Components & PCBs": [
    "Batteries & E-Scrap"
  ],
  "Consumer Electronics": [
    "Batteries & E-Scrap",
    "Consumer & Commercial"
  ],
  "Batteries & Battery Scrap": [
    "Batteries & E-Scrap"
  ],
  "Solar & Renewable Energy Equipment": [
    "Batteries & E-Scrap"
  ],
  "Energy Storage Equipment": [
    "Batteries & E-Scrap"
  ],
  "Metal Scrap & Metal Products": [
    "Metals"
  ],
  "Ferrous Metals": [
    "Metals"
  ],
  "Non-Ferrous Metals": [
    "Metals"
  ],
  "Precious Metals & Precious Metal Articles": [
    "Metals"
  ],
  "Minerals & Industrial Minerals": [
    "Metals"
  ],
  "Paper, Cardboard & Paper Products": [
    "Paper"
  ],
  "Plastic & Plastic Scrap": [
    "Plastics & Rubber"
  ],
  "Rubber & Rubber Products": [
    "Plastics & Rubber"
  ],
  "Glass & Glass Products": [
    "Construction & Materials"
  ],
  "Wood & Timber Products": [
    "Construction & Materials"
  ],
  "Textiles, Fabrics & Garments": [
    "Textiles & Leather"
  ],
  "Leather & Leather Products": [
    "Textiles & Leather"
  ],
  "Carpets, Rugs & Furnishings": [
    "Textiles & Leather"
  ],
  "Food & Food Products": [
    "Food & Agricultural"
  ],
  "Beverages & Consumables": [
    "Food & Agricultural"
  ],
  "Agricultural Produce & Commodities": [
    "Food & Agricultural"
  ],
  "Seeds, Feed & Agricultural Inputs": [
    "Food & Agricultural"
  ],
  "Food Processing Products & Equipment": [
    "Food & Agricultural"
  ],
  "Chemicals & Chemical Products": [
    "Chemicals & Fluids"
  ],
  "Oils, Lubricants & Industrial Fluids": [
    "Chemicals & Fluids"
  ],
  "Paints, Coatings & Adhesives": [
    "Chemicals & Fluids"
  ],
  "Pharmaceuticals & Healthcare Products": [
    "Chemicals & Fluids"
  ],
  "Cleaning & Industrial Consumables": [
    "Chemicals & Fluids"
  ],
  "Building & Construction Materials": [
    "Construction & Materials"
  ],
  "Components & Spare Parts": [
    "Consumer & Commercial"
  ],
  "MRO Materials & Consumables": [
    "Consumer & Commercial"
  ],
  "Packaging Materials": [
    "Consumer & Commercial"
  ],
  "Finished Goods & Consumer Products": [
    "Consumer & Commercial"
  ],
  "Excess & Obsolete Inventory": [
    "Consumer & Commercial"
  ],
  "Commercial Stock & Inventory": [
    "Consumer & Commercial"
  ],
  "General Merchandise": [
    "Consumer & Commercial"
  ],
  "Antiques & Vintage Goods": [
    "Antiques & Collectibles"
  ],
  "Art & Paintings": [
    "Antiques & Collectibles"
  ],
  "Sculptures & Decorative Objects": [
    "Antiques & Collectibles"
  ],
  "Coins, Currency & Medals": [
    "Antiques & Collectibles"
  ],
  "Jewellery & Precious Articles": [
    "Antiques & Collectibles"
  ],
  "Watches & Clocks": [
    "Antiques & Collectibles"
  ],
  "Books, Manuscripts & Documents": [
    "Antiques & Collectibles"
  ],
  "Collectibles & Memorabilia": [
    "Antiques & Collectibles"
  ],
  "Historical & Heritage Objects": [
    "Antiques & Collectibles"
  ],
  "Traditional Crafts & Cultural Objects": [
    "Antiques & Collectibles"
  ],
  "Vintage Machinery & Equipment": [
    "Antiques & Collectibles"
  ],
  "Residential Contents": [
    "Institutional / Special"
  ],
  "Commercial Contents": [
    "Institutional / Special"
  ],
  "Industrial Contents": [
    "Institutional / Special"
  ],
  "Personal Effects": [
    "Institutional / Special"
  ],
  "Bags & Luggage": [
    "Institutional / Special"
  ],
  "Clothing & Personal Items": [
    "Institutional / Special"
  ],
  "Lost Documents & Identification": [
    "Institutional / Special"
  ],
  "Lost Property & Miscellaneous Articles": [
    "Institutional / Special"
  ],
  "Mixed Metal Scrap": [
    "Institutional / Special"
  ],
  "Mixed Electrical Scrap": [
    "Institutional / Special"
  ],
  "Mixed E-Scrap / E-Waste": [
    "Institutional / Special"
  ],
  "Mixed Plastic Scrap": [
    "Institutional / Special"
  ],
  "Mixed Paper & Packaging Waste": [
    "Institutional / Special"
  ],
  "Industrial Scrap & Waste": [
    "Institutional / Special"
  ],
  "Recyclable Materials": [
    "Institutional / Special"
  ],
  "Recovered Materials": [
    "Institutional / Special"
  ],
  "Mixed / Assorted Lots": [
    "Institutional / Special"
  ],
  "Customs / Imported Goods": [
    "Institutional / Special"
  ],
  "Confiscated Goods": [
    "Institutional / Special"
  ],
  "Seized / Forfeited Goods": [
    "Institutional / Special"
  ],
  "Abandoned Cargo": [
    "Institutional / Special"
  ],
  "Unclaimed Cargo & Shipments": [
    "Institutional / Special"
  ],
  "Repossessed Business Assets": [
    "Institutional / Special"
  ],
  "Repossessed Inventory & Stock": [
    "Institutional / Special"
  ]
};

export const MICROCATS_BY_SUBCAT = {};
for (const sub of SUBCATEGORIES) {
  const groups = SUB_TO_MICRO_GROUPS[sub.label];
  if (!groups || groups.length === 0) continue;
  MICROCATS_BY_SUBCAT[sub.id] = MICROCATEGORIES.filter((m) => groups.includes(m.group));
}

// ── Location scope: named regions (multi-state groupings) + every
// Indian state/UT, individually selectable alongside the regions.
export const LOC_REGIONS = [
  'Delhi NCR', 'Eastern India', 'Western India', 'Northern India',
  'Southern India', 'North-East India', 'Central India',
];
export const LOC_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];
export const LOC_OPTIONS = [
  ...LOC_REGIONS.map((label) => ({ id: `region:${label}`, label, group: 'Regions' })),
  ...LOC_STATES.map((label) => ({ id: `state:${label}`, label, group: 'States & UTs' })),
];

// ── Value scope: discrete bands from ₹0 to an open-ended top band,
// matching the doc's own "₹2–10 lakh" / "₹10–50 lakh" style.
export const VALUE_BANDS = [0, 10000, 25000, 50000, 100000, 200000, 500000, 1000000, 2500000, 5000000, 7500000, 10000000];
export const VALUE_BAND_LABELS = ['₹0', '₹10K', '₹25K', '₹50K', '₹1L', '₹2L', '₹5L', '₹10L', '₹25L', '₹50L', '₹75L', '₹1Cr+'];
export const VALUE_MAX_INDEX = VALUE_BAND_LABELS.length - 1;

export function formatValueRange(loIdx, hiIdx) {
  if (loIdx === 0 && hiIdx === VALUE_MAX_INDEX) return 'Any value';
  if (hiIdx === VALUE_MAX_INDEX) return `${VALUE_BAND_LABELS[loIdx]}+`;
  return `${VALUE_BAND_LABELS[loIdx]}–${VALUE_BAND_LABELS[hiIdx]}`;
}

export function formatLocList(ids) {
  if (!ids || ids.length === 0) return 'All India';
  const labels = ids.map((id) => id.split(':').slice(1).join(':'));
  if (labels.length <= 2) return labels.join(', ');
  return `${labels.slice(0, 2).join(', ')} +${labels.length - 2} more`;
}
