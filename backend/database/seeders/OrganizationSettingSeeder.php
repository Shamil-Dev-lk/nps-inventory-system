<?php

namespace Database\Seeders;

use App\Models\OrganizationSetting;
use Illuminate\Database\Seeder;

class OrganizationSettingSeeder extends Seeder
{
    public function run(): void
    {
        OrganizationSetting::updateOrCreate(['id' => 1], [
            'name_en' => config('organization.name_en', 'Nikaweratiya Pradeshiya Sabha'),
            'name_si' => config('organization.name_si', 'නිකවැරටිය ප්රාදේශීය සභා'),
            'name_ta' => config('organization.name_ta'),
            'short_name' => config('organization.short_name', 'NPS'),
            'district' => config('organization.district', 'Kurunegala'),
            'province' => config('organization.province', 'North Western'),
            'address' => 'Nikaweratiya, Kurunegala District, Sri Lanka',
            'telephone' => '+94 37 2260 123',
            'email' => 'info@nps.gov.lk',
            'primary_color' => '#006838',
            'secondary_color' => '#8DC63F',
            'accent_color' => '#FDB913',
            'system_name' => 'ANTIGRAVITY',
            'system_subtitle' => 'Government Store & Inventory Management System',
            'footer_text' => 'Powered by ANTIGRAVITY v1.0',
            'copyright' => '\u00a9 ' . date('Y') . ' Nikaweratiya Pradeshiya Sabha. All rights reserved.',
            'currency' => 'LKR',
            'currency_symbol' => 'Rs.',
            'date_format' => 'd/m/Y',
            'timezone' => 'Asia/Colombo',
            'default_language' => 'en',
            'enable_email_notifications' => true,
        ]);
    }
}
