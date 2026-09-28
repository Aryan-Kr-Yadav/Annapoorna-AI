"""
Verified government agricultural schemes seed data.
All scheme entries strictly originate from official Indian government sources
(myScheme.gov.in, Ministry of Agriculture & Farmers Welfare, PM-KISAN, PMFBY, PMKSY, state portals).
Groq is NEVER the source of truth for facts in this file.
"""
from datetime import date

SCHEMES_SEED = [
    {
        "name": "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
        "short_name": "PM-KISAN",
        "description": "Central sector scheme providing income support of Rs. 6,000 per year in three equal four-monthly installments of Rs. 2,000 directly into bank accounts of all landholding farmer families.",
        "scheme_type": "central",
        "scope": "national",
        "state": None,
        "category": "income_support",
        "target_beneficiaries": [
            "All landholding farmer families with cultivable land parcel in their name",
            "Small and marginal farmers across all Indian states and Union Territories"
        ],
        "benefits": [
            "Rs. 6,000 per year transferred in 3 equal installments of Rs. 2,000 every four months",
            "100% funding by Government of India through Direct Benefit Transfer (DBT)",
            "Direct credit to Aadhaar-seeded bank accounts without intermediaries"
        ],
        "eligibility": [
            "Farmer family holding cultivable land in official land records",
            "Subject to exclusion criteria: institutional landholders, farmer families holding constitutional posts, serving/retired government employees, income tax payees in last assessment year, doctors/engineers/lawyers"
        ],
        "required_documents": [
            "Aadhaar Card (mandatory)",
            "Land ownership records (Khatauni / Khasra / RoR)",
            "Active Aadhaar-linked Bank Account details with IFSC",
            "Mobile number linked with Aadhaar for e-KYC"
        ],
        "application_process": [
            "Self-registration online via Farmers Corner on official portal pmkisan.gov.in",
            "Or registration through Common Service Centres (CSCs)",
            "Or submission through local village Patwari / Lekhpal / Revenue Nodal Officer",
            "Mandatory completion of Aadhaar e-KYC via OTP or biometric"
        ],
        "official_url": "https://pmkisan.gov.in",
        "source": "Ministry of Agriculture & Farmers Welfare",
        "source_url": "https://www.myscheme.gov.in/schemes/pm-kisan",
        "ministry_or_department": "Ministry of Agriculture and Farmers Welfare",
        "active_status": True,
        "start_date": date(2018, 12, 1),
        "end_date": None,
        "last_verified": date(2026, 3, 1),
        "applicable_crops": None,
        "matching_criteria": {
            "requires_land_ownership": True,
            "eligible_states": None,
            "eligible_crops": None,
            "land_size_max_hectares": None
        }
    },
    {
        "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        "short_name": "PMFBY",
        "description": "Comprehensive national crop insurance scheme providing complete financial support and risk coverage against crop loss caused by non-preventable natural calamities, pests, and diseases.",
        "scheme_type": "central",
        "scope": "national",
        "state": None,
        "category": "insurance",
        "target_beneficiaries": [
            "Farmers growing notified crops in notified areas",
            "Both loanee farmers and non-loanee sharecroppers/tenant farmers"
        ],
        "benefits": [
            "Comprehensive coverage for standing crops, prevented sowing, mid-season adversity, and post-harvest losses",
            "Farmer pays minimal premium: 2.0% for Kharif food/oilseeds, 1.5% for Rabi food/oilseeds, and 5.0% for commercial/horticultural crops",
            "Remaining premium subsidized up to 90% equally by Central and State Governments"
        ],
        "eligibility": [
            "Farmers cultivating notified crops in notified areas as declared by State Governments",
            "Voluntary for all farmers (compulsory enrollment opt-out available for loanee farmers)",
            "Must register before crop-season cutoff deadline"
        ],
        "required_documents": [
            "Aadhaar Card",
            "Land possession record (Khatauni / 7-12 extract) or tenancy agreement / sharecropper declaration",
            "Sowing certificate or declaration issued by Village Revenue Officer / Patwari",
            "Bank passbook with account number and IFSC"
        ],
        "application_process": [
            "Apply online through National Crop Insurance Portal (pmfby.gov.in)",
            "Or enroll through bank branch issuing KCC crop loans",
            "Or apply via Common Service Centres (CSCs) or authorized insurance representatives before seasonal cutoff"
        ],
        "official_url": "https://pmfby.gov.in",
        "source": "Ministry of Agriculture & Farmers Welfare",
        "source_url": "https://www.myscheme.gov.in/schemes/pmfby",
        "ministry_or_department": "Ministry of Agriculture and Farmers Welfare",
        "active_status": True,
        "start_date": date(2016, 2, 18),
        "end_date": None,
        "last_verified": date(2026, 3, 1),
        "applicable_crops": None,
        "matching_criteria": {
            "insurance_related": True,
            "eligible_states": None,
            "eligible_crops": None
        }
    },
    {
        "name": "Kisan Credit Card (KCC)",
        "short_name": "KCC",
        "description": "Provides institutional credit for farmers to meet short-term cultivation expenses, post-harvest costs, produce marketing loans, and maintenance of farm assets.",
        "scheme_type": "central",
        "scope": "national",
        "state": None,
        "category": "credit",
        "target_beneficiaries": [
            "Owner cultivators, tenant farmers, oral lessees, and sharecroppers",
            "Joint Liability Groups (JLGs) and Self Help Groups (SHGs) of farmers"
        ],
        "benefits": [
            "Hassle-free crop loans up to Rs. 3,00,000 at concessional interest rate of 7% p.a.",
            "3% prompt repayment incentive bringing effective interest rate down to 4% p.a.",
            "Collateral-free credit limit up to Rs. 1,60,000",
            "Issued with RuPay debit card for easy ATM and POS transactions"
        ],
        "eligibility": [
            "All farmers, individual or joint borrowers who are owner cultivators",
            "Tenant farmers, oral lessees, and sharecroppers with valid land cultivation records",
            "Age between 18 and 75 years (co-borrower required for age > 60 years)"
        ],
        "required_documents": [
            "Duly filled one-page KCC application form",
            "Identity Proof (Aadhaar, Voter ID, PAN)",
            "Address Proof",
            "Land ownership documents / Patwari record showing crop cultivated",
            "Two passport size photographs"
        ],
        "application_process": [
            "Download simplified KCC form from pmkisan.gov.in or any commercial/cooperative bank website",
            "Submit form and land records to the bank branch where farmer holds savings account",
            "Bank mandated to process and issue KCC within 14 days"
        ],
        "official_url": "https://www.myscheme.gov.in/schemes/kisan-credit-card-kcc",
        "source": "Department of Agriculture & Farmers Welfare / RBI",
        "source_url": "https://agricoop.nic.in",
        "ministry_or_department": "Ministry of Agriculture and Farmers Welfare",
        "active_status": True,
        "start_date": date(1998, 8, 1),
        "end_date": None,
        "last_verified": date(2026, 3, 1),
        "applicable_crops": None,
        "matching_criteria": {
            "credit_related": True,
            "eligible_states": None,
            "eligible_crops": None
        }
    },
    {
        "name": "PMKSY - Per Drop More Crop (Micro Irrigation)",
        "short_name": "PMKSY-PDMC",
        "description": "Focuses on maximizing water productivity through precision micro-irrigation systems (drip and sprinkler), reducing irrigation costs, water wastage, and fertilizer runoff.",
        "scheme_type": "central",
        "scope": "national",
        "state": None,
        "category": "irrigation",
        "target_beneficiaries": [
            "Small and marginal farmers (special 55% subsidy category)",
            "General category farmers (up to 45% subsidy)",
            "Farmers across all states with access to a water source"
        ],
        "benefits": [
            "55% financial subsidy for Small and Marginal farmers on drip and sprinkler installation",
            "45% financial subsidy for Other (medium and large) farmers",
            "Additional state top-up subsidy provided in several states (up to 70-80% total support)",
            "Saves 30% to 50% water and increases crop yields by 20% to 40%"
        ],
        "eligibility": [
            "Farmers possessing agricultural land with an assured irrigation source (borewell, tube well, open well, or farm pond)",
            "Members of cooperative societies, water user groups, or FPOs",
            "Tenant farmers with registered lease agreement for at least 7 years"
        ],
        "required_documents": [
            "Aadhaar Card",
            "Land title documents (7/12 extract / Khatauni / Jamabandi)",
            "Electricity bill / proof of water pump connection",
            "Bank passbook",
            "Soil and water quality test report (where applicable)"
        ],
        "application_process": [
            "Apply online through State Agriculture / Horticulture Department portal or pmksy.gov.in",
            "Site inspection by field officers to verify water source and plot dimensions",
            "System installation by government-empanelled micro-irrigation vendor",
            "Post-installation verification and direct transfer of subsidy"
        ],
        "official_url": "https://pmksy.gov.in",
        "source": "Department of Agriculture and Farmers Welfare",
        "source_url": "https://pmksy.gov.in/pdms/",
        "ministry_or_department": "Ministry of Agriculture and Farmers Welfare",
        "active_status": True,
        "start_date": date(2015, 7, 1),
        "end_date": None,
        "last_verified": date(2026, 3, 1),
        "applicable_crops": None,
        "matching_criteria": {
            "irrigation_related": True,
            "requires_water_source": True,
            "eligible_states": None,
            "eligible_crops": None
        }
    },
    {
        "name": "Soil Health Card Scheme",
        "short_name": "SHC",
        "description": "Provides farmers with comprehensive soil analysis reports indicating 12 key macro and micro nutrient parameters, with customized crop-wise fertilizer dosage recommendations.",
        "scheme_type": "central",
        "scope": "national",
        "state": None,
        "category": "soil_health",
        "target_beneficiaries": [
            "All farming families across all agricultural districts of India"
        ],
        "benefits": [
            "Free laboratory testing of soil samples every 3 years",
            "Detailed report card analyzing 12 chemical parameters: N, P, K, S, Zn, Fe, Cu, Mn, Bo, pH, EC, OC",
            "Scientifically calculated fertilizer and organic manure dosage recommendations",
            "Reduces indiscriminate chemical fertilizer use and cuts production input expenses"
        ],
        "eligibility": [
            "All agricultural landholders in India"
        ],
        "required_documents": [
            "Land parcel identifier (Khasra / Survey number)",
            "Farmer identity details (Aadhaar or local farmer registration ID)"
        ],
        "application_process": [
            "Soil samples collected systematically by state agricultural department extension staff",
            "Tested at district Soil Testing Laboratories (STLs)",
            "Printed Soil Health Card delivered to farmer or downloaded online from soilhealth.dac.gov.in"
        ],
        "official_url": "https://soilhealth.dac.gov.in",
        "source": "Ministry of Agriculture and Farmers Welfare",
        "source_url": "https://www.myscheme.gov.in/schemes/soil-health-card-scheme",
        "ministry_or_department": "Ministry of Agriculture and Farmers Welfare",
        "active_status": True,
        "start_date": date(2015, 2, 19),
        "end_date": None,
        "last_verified": date(2026, 3, 1),
        "applicable_crops": None,
        "matching_criteria": {
            "soil_related": True,
            "eligible_states": None,
            "eligible_crops": None
        }
    },
    {
        "name": "SMAM (Sub-Mission on Agricultural Mechanization)",
        "short_name": "SMAM",
        "description": "Financial assistance program enabling farmers to acquire modern farm machinery, tractors, power tillers, rotavators, and laser levellers at subsidized rates.",
        "scheme_type": "central",
        "scope": "national",
        "state": None,
        "category": "equipment",
        "target_beneficiaries": [
            "Small and marginal farmers",
            "Women farmers and SC/ST farmers (higher subsidy tier)",
            "Custom Hiring Centres (CHCs) and Farmer Producer Organizations (FPOs)"
        ],
        "benefits": [
            "40% to 50% financial subsidy on purchase of individual agricultural machinery",
            "Up to 80% capital subsidy for establishing village-level Custom Hiring Centres (CHCs)",
            "Special 10% additional subsidy concession for women, SC, and ST beneficiaries"
        ],
        "eligibility": [
            "Individual farmers owning cultivable agricultural land",
            "Cooperative societies, farmer groups, and FPOs",
            "Must not have received subsidy for the same equipment category in last 5 years"
        ],
        "required_documents": [
            "Aadhaar Card",
            "Landholding certificate / RoR (Khasra / Khatauni)",
            "Caste certificate (for SC/ST concession category)",
            "Bank passbook",
            "Proforma invoice / quotation from registered machinery dealer"
        ],
        "application_process": [
            "Apply online through DBT in Agriculture Mechanization portal (agrimachinery.nic.in)",
            "Choose equipment type and authorized dealer",
            "District Level Executive Committee (DLEC) approval / online lottery",
            "Purchase equipment, undergo physical inspection, and receive DBT subsidy"
        ],
        "official_url": "https://agrimachinery.nic.in",
        "source": "Ministry of Agriculture & Farmers Welfare",
        "source_url": "https://agrimachinery.nic.in",
        "ministry_or_department": "Ministry of Agriculture and Farmers Welfare",
        "active_status": True,
        "start_date": date(2014, 4, 1),
        "end_date": None,
        "last_verified": date(2026, 3, 1),
        "applicable_crops": None,
        "matching_criteria": {
            "equipment_related": True,
            "eligible_states": None,
            "eligible_crops": None
        }
    },
    {
        "name": "PKVY (Paramparagat Krishi Vikas Yojana)",
        "short_name": "PKVY",
        "description": "Cluster-based program under the National Mission for Sustainable Agriculture promoting organic farming through Participatory Guarantee System (PGS) certification and financial input support.",
        "scheme_type": "central",
        "scope": "national",
        "state": None,
        "category": "organic_farming",
        "target_beneficiaries": [
            "Farmer clusters adopting certified organic farming methods",
            "Small and marginal farmers in traditional agricultural belts"
        ],
        "benefits": [
            "Financial assistance of Rs. 50,000 per hectare over a 3-year period",
            "Rs. 31,000/ha transferred directly to farmer for organic inputs (seeds, bio-fertilizers, vermicompost, botanical extracts)",
            "Free PGS-India organic certification and marketing/packaging assistance"
        ],
        "eligibility": [
            "Farmers forming an organic cluster of 20 hectares (or 50 farmers)",
            "Willingness to transition farm land to chemical-free farming for at least 3 years",
            "Compliance with PGS-India organic certification norms"
        ],
        "required_documents": [
            "Aadhaar Card",
            "Land title documents",
            "Cluster member declaration and agreement",
            "Bank account details"
        ],
        "application_process": [
            "Form a cluster of 50 farmers or contact local Regional Council (RC)",
            "Registration on Jaivik Kheti portal (jaivikkheti.in)",
            "Field inspection, organic input procurement, and periodic soil sampling"
        ],
        "official_url": "https://pgsindia-ncof.gov.in",
        "source": "Ministry of Agriculture and Farmers Welfare",
        "source_url": "https://www.myscheme.gov.in/schemes/pkvy",
        "ministry_or_department": "Ministry of Agriculture and Farmers Welfare",
        "active_status": True,
        "start_date": date(2015, 4, 1),
        "end_date": None,
        "last_verified": date(2026, 3, 1),
        "applicable_crops": None,
        "matching_criteria": {
            "organic_related": True,
            "eligible_states": None,
            "eligible_crops": None
        }
    },
    {
        "name": "PM-KUSUM (Component B - Standalone Solar Agriculture Pumps)",
        "short_name": "PM-KUSUM",
        "description": "Scheme for farmers in off-grid rural areas to install standalone solar-powered irrigation pump sets up to 7.5 HP, replacing diesel pumps and ensuring zero electricity bills.",
        "scheme_type": "central",
        "scope": "national",
        "state": None,
        "category": "solar_energy",
        "target_beneficiaries": [
            "Individual farmers with agricultural land lacking grid electricity connection",
            "Water User Associations, community tube well groups, and FPOs"
        ],
        "benefits": [
            "Up to 60% total capital subsidy (30% Central Government + 30% State Government)",
            "Farmer contributes only 40% (bank loan available for up to 30% of cost)",
            "Reliable daytime power for irrigation; complete savings on diesel fuel expenses"
        ],
        "eligibility": [
            "Farmers owning agricultural land with an existing open well, borewell, or surface water source",
            "No existing electric agricultural connection on the specified land parcel",
            "Pump capacity matched to water table depth (up to 7.5 HP)"
        ],
        "required_documents": [
            "Aadhaar Card",
            "Land ownership revenue records (Khatauni / 7-12 / Jamabandi)",
            "Affidavit confirming no existing grid connection",
            "Bank passbook",
            "Proof of water source availability"
        ],
        "application_process": [
            "Apply through state designated renewable energy nodal agency portal (e.g. UPNEDA, MEDA, HAREDA)",
            "Verification of water table and solar feasibility by state agency",
            "Farmer deposits beneficiary share; installation completed by empaneled vendor within 90 days"
        ],
        "official_url": "https://pmkusum.mnre.gov.in",
        "source": "Ministry of New and Renewable Energy",
        "source_url": "https://pmkusum.mnre.gov.in",
        "ministry_or_department": "Ministry of New and Renewable Energy",
        "active_status": True,
        "start_date": date(2019, 3, 8),
        "end_date": None,
        "last_verified": date(2026, 3, 1),
        "applicable_crops": None,
        "matching_criteria": {
            "irrigation_related": True,
            "solar_related": True,
            "eligible_states": None,
            "eligible_crops": None
        }
    },
    {
        "name": "MIDH (Mission for Integrated Development of Horticulture)",
        "short_name": "MIDH",
        "description": "Centrally sponsored scheme promoting holistic growth of the horticulture sector including fruits, vegetables, root & tuber crops, mushrooms, spices, flowers, and aromatic plants.",
        "scheme_type": "central",
        "scope": "national",
        "state": None,
        "category": "horticulture",
        "target_beneficiaries": [
            "Horticulture and vegetable growers",
            "Farmers investing in protected cultivation (polyhouses, shade nets) and high-density orchards"
        ],
        "benefits": [
            "40% to 50% subsidy on establishment of new orchards and commercial vegetable gardens",
            "50% subsidy on protected cultivation structures (polyhouses, naturally ventilated greenhouses, shade net houses)",
            "Financial support for mushroom production units, pack houses, and on-farm cold rooms"
        ],
        "eligibility": [
            "Farmers cultivating or intending to cultivate notified fruits, vegetables, flowers, or spices",
            "Land title or registered long-term lease agreement in farmer name"
        ],
        "required_documents": [
            "Aadhaar Card",
            "Land ownership records / registered lease deed",
            "Detailed Project Report (DPR) for polyhouse/high-value projects",
            "Bank account details"
        ],
        "application_process": [
            "Submit application on State Horticulture Mission portal or via District Horticulture Officer (DHO)",
            "Technical feasibility evaluation and administrative sanction",
            "Subsidy released directly or credit-linked to term loan"
        ],
        "official_url": "https://midh.gov.in",
        "source": "Department of Agriculture and Farmers Welfare",
        "source_url": "https://midh.gov.in",
        "ministry_or_department": "Ministry of Agriculture and Farmers Welfare",
        "active_status": True,
        "start_date": date(2014, 4, 1),
        "end_date": None,
        "last_verified": date(2026, 3, 1),
        "applicable_crops": [
            "tomato", "potato", "onion", "banana", "mango", "citrus", "papaya",
            "vegetables", "fruits", "flowers", "spices", "chilli"
        ],
        "matching_criteria": {
            "eligible_crops": [
                "tomato", "potato", "onion", "banana", "mango", "citrus", "papaya",
                "vegetables", "fruits", "flowers", "spices", "chilli"
            ],
            "eligible_states": None
        }
    },
    {
        "name": "UP Beej Anudan Yojana (Certified Seed Subsidy - Uttar Pradesh)",
        "short_name": "UP-Beej-Anudan",
        "description": "Uttar Pradesh state government scheme delivering direct price subsidies on certified and high-yielding hybrid seeds of major agricultural crops to farmers across UP.",
        "scheme_type": "state",
        "scope": "state",
        "state": "Uttar Pradesh",
        "category": "seeds",
        "target_beneficiaries": [
            "Farmers registered on the UP Agriculture Portal cultivating land within Uttar Pradesh"
        ],
        "benefits": [
            "Up to 50% direct subsidy on certified seeds of Wheat, Paddy, Mustard, Gram, Lentils, and Coarse Cereals",
            "Subsidy transferred directly to farmer bank account via DBT through Agri Pardarshi portal",
            "Assures certified seed quality, high germination rate, and resistance against local crop diseases"
        ],
        "eligibility": [
            "Farmers registered on UP Agriculture Department Portal (upagripardarshi.gov.in)",
            "Cultivating agricultural land in any district of Uttar Pradesh",
            "Purchasing seeds through authorized government agricultural seed stores or cooperative outlets"
        ],
        "required_documents": [
            "UP Kisan Panjikaran Number (Farmer Registration ID)",
            "Aadhaar Card",
            "Aadhaar-linked Bank Account details",
            "Seed purchase invoice / receipt from government seed store"
        ],
        "application_process": [
            "Register on UP Agri Pardarshi portal (upagripardarshi.gov.in)",
            "Generate online seed purchase token during sowing season",
            "Buy certified seed from designated government/cooperative seed depot; subsidy transferred via DBT"
        ],
        "official_url": "https://upagripardarshi.gov.in",
        "source": "Department of Agriculture, Government of Uttar Pradesh",
        "source_url": "https://upagripardarshi.gov.in",
        "ministry_or_department": "Department of Agriculture, Uttar Pradesh",
        "active_status": True,
        "start_date": date(2017, 4, 1),
        "end_date": None,
        "last_verified": date(2026, 3, 1),
        "applicable_crops": [
            "wheat", "rice", "paddy", "mustard", "chickpea", "lentil", "maize", "barley"
        ],
        "matching_criteria": {
            "eligible_states": ["Uttar Pradesh"],
            "eligible_crops": ["wheat", "rice", "paddy", "mustard", "chickpea", "lentil", "maize", "barley"]
        }
    },
    {
        "name": "Maharashtra Nanaji Deshmukh Krishi Sanjivani Prakalp (PoCRA)",
        "short_name": "PoCRA",
        "description": "Climate-resilient agriculture project across drought-prone and salinity-affected districts of Maharashtra, providing major subsidies for individual farm ponds, micro-irrigation, and shade nets.",
        "scheme_type": "state",
        "scope": "state",
        "state": "Maharashtra",
        "category": "irrigation",
        "target_beneficiaries": [
            "Small and marginal farmers (landholding up to 2 hectares) in 5,142 notified villages of 15 districts of Maharashtra",
            "Women farmers and SC/ST farmers given top priority"
        ],
        "benefits": [
            "Up to 75% subsidy for small/marginal farmers on farm ponds (Shet Tale), shade net houses, and drip/sprinkler systems",
            "Financial assistance up to Rs. 1,00,000 for individual climate-resilient water storage and micro-irrigation",
            "Direct subsidy credit through DBT upon GPS-tagged completion verification"
        ],
        "eligibility": [
            "Farmer residing in notified project villages of Maharashtra (Vidarbha, Marathwada, and Nashik regions)",
            "Landholding not exceeding 2.0 hectares (small and marginal category)",
            "Valid 7/12 land extract in Maharashtra"
        ],
        "required_documents": [
            "Aadhaar Card",
            "7/12 Land Extract and 8-A Extract showing landholding <= 2 hectares",
            "Caste Certificate (if claiming SC/ST priority category)",
            "Bank passbook with IFSC",
            "Consent letter of joint landholders if applicable"
        ],
        "application_process": [
            "Apply online through PoCRA official portal (mahapocra.gov.in) or mobile app",
            "Village Climate Resilience Committee (VCRMC) scrutiny and pre-sanction issuance",
            "Execute component, upload geo-tagged photo proof, and receive direct subsidy into bank account"
        ],
        "official_url": "https://mahapocra.gov.in",
        "source": "Department of Agriculture, Government of Maharashtra",
        "source_url": "https://mahapocra.gov.in",
        "ministry_or_department": "Department of Agriculture, Maharashtra",
        "active_status": True,
        "start_date": date(2018, 5, 1),
        "end_date": None,
        "last_verified": date(2026, 3, 1),
        "applicable_crops": None,
        "matching_criteria": {
            "eligible_states": ["Maharashtra"],
            "land_size_max_hectares": 2.0,
            "irrigation_related": True
        }
    },
    {
        "name": "Bhavantar Bharpayee Yojana (BBY - Haryana)",
        "short_name": "BBY-Haryana",
        "description": "Haryana state price deficit compensation scheme protecting horticulture and vegetable growers from distress sales when market mandi prices fall below protected benchmark cost.",
        "scheme_type": "state",
        "scope": "state",
        "state": "Haryana",
        "category": "market_support",
        "target_beneficiaries": [
            "Vegetable and horticulture growers in Haryana registered on Meri Fasal Mera Byora"
        ],
        "benefits": [
            "Fixed financial compensation per quintal/acre paid directly into farmer bank account if market mandi price crashes below base price",
            "Covers major horticultural crops: Potato, Onion, Tomato, Cauliflower, Carrot, Peas, Guava, and Kinnow",
            "Guarantees minimum income safety net against perishable crop market volatility"
        ],
        "eligibility": [
            "Farmers cultivating notified vegetables or fruits on land located in Haryana",
            "Mandatory registration of crop acreage on Haryana Meri Fasal Mera Byora portal during sowing window",
            "Sale of produce through recognized APMC mandis on e-NAM"
        ],
        "required_documents": [
            "Meri Fasal Mera Byora (MFMB) registration acknowledgment",
            "Parivar Pehchan Patra (Family ID)",
            "Aadhaar Card",
            "J-Form / Mandi sale bill from authorized APMC market committee"
        ],
        "application_process": [
            "Register crop details on Meri Fasal Mera Byora portal (fasal.haryana.gov.in) during registration period",
            "Sell produce through authorized e-NAM grain/vegetable markets in Haryana",
            "System automatically computes deficit between model price and base price; DBT credited to bank"
        ],
        "official_url": "https://agriharyana.gov.in",
        "source": "Haryana State Agricultural Marketing Board & Agriculture Department",
        "source_url": "https://agriharyana.gov.in",
        "ministry_or_department": "Department of Agriculture and Farmers Welfare, Haryana",
        "active_status": True,
        "start_date": date(2018, 1, 1),
        "end_date": None,
        "last_verified": date(2026, 3, 1),
        "applicable_crops": [
            "potato", "onion", "tomato", "cauliflower", "carrot", "peas", "guava", "kinnow"
        ],
        "matching_criteria": {
            "eligible_states": ["Haryana"],
            "eligible_crops": [
                "potato", "onion", "tomato", "cauliflower", "carrot", "peas", "guava", "kinnow"
            ]
        }
    }
]
