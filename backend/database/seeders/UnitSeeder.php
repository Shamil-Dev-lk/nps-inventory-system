<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            ['code' => 'EACH', 'name_en' => 'Each', 'name_si' => 'කට', 'symbol' => 'ea'],
            ['code' => 'KG', 'name_en' => 'Kilogram', 'name_si' => 'කිලොග්රාම්', 'symbol' => 'kg'],
            ['code' => 'G', 'name_en' => 'Gram', 'name_si' => 'ග්රාම්', 'symbol' => 'g'],
            ['code' => 'L', 'name_en' => 'Litre', 'name_si' => 'ලිටර්', 'symbol' => 'L'],
            ['code' => 'ML', 'name_en' => 'Millilitre', 'name_si' => 'මිලිලිටර්', 'symbol' => 'ml'],
            ['code' => 'M', 'name_en' => 'Metre', 'name_si' => 'මිටර්', 'symbol' => 'm'],
            ['code' => 'CM', 'name_en' => 'Centimetre', 'name_si' => 'සැන්ටිමිටර්', 'symbol' => 'cm'],
            ['code' => 'BOX', 'name_en' => 'Box', 'name_si' => 'කුටුව', 'symbol' => 'box'],
            ['code' => 'PKT', 'name_en' => 'Packet', 'name_si' => 'ප්රඩැක්ටර්කුව', 'symbol' => 'pkt'],
            ['code' => 'BTL', 'name_en' => 'Bottle', 'name_si' => 'බල්ලය', 'symbol' => 'btl'],
            ['code' => 'SET', 'name_en' => 'Set', 'name_si' => 'සේට්', 'symbol' => 'set'],
            ['code' => 'PAIR', 'name_en' => 'Pair', 'name_si' => 'ලකුන', 'symbol' => 'pair'],
            ['code' => 'ROLL', 'name_en' => 'Roll', 'name_si' => 'රෝල්', 'symbol' => 'roll'],
            ['code' => 'SHT', 'name_en' => 'Sheet', 'name_si' => 'ශීට්', 'symbol' => 'sht'],
            ['code' => 'DOZ', 'name_en' => 'Dozen', 'name_si' => 'දලහ', 'symbol' => 'doz'],
        ];

        foreach ($units as $unit) {
            Unit::firstOrCreate(['code' => $unit['code']], $unit);
        }
    }
}
