<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Organization Configuration
    |--------------------------------------------------------------------------
    | Default values — these are overridden by the organization_settings table.
    | No code change is needed to deploy to a different Pradeshiya Sabha.
    */
    'name_en' => env('ORG_NAME', 'Nikaweratiya Pradeshiya Sabha'),
    'name_si' => env('ORG_NAME_SI', 'නිකවැරටිය ප්රාදේශීය සභා'),
    'name_ta' => env('ORG_NAME_TA', 'நிகவெரட்டிய பிரதேசீய சபை'),
    'short_name' => env('ORG_SHORT_NAME', 'NPS'),
    'district' => env('ORG_DISTRICT', 'Kurunegala'),
    'province' => env('ORG_PROVINCE', 'North Western'),
    'address' => env('ORG_ADDRESS', 'Nikaweratiya, Sri Lanka'),
    'telephone' => env('ORG_TELEPHONE', '+94 37 2260 123'),
    'email' => env('ORG_EMAIL', 'info@nps.gov.lk'),
    'website' => env('ORG_WEBSITE', 'https://nps.gov.lk'),
    'primary_color' => '#006838',
    'secondary_color' => '#8DC63F',
    'accent_color' => '#FDB913',
    'system_name' => 'ANTIGRAVITY',
    'system_subtitle' => 'Government Store & Inventory Management System',
    'footer_text' => 'Powered by ANTIGRAVITY',
    'copyright' => '© 2024 Nikaweratiya Pradeshiya Sabha. All rights reserved.',
];
