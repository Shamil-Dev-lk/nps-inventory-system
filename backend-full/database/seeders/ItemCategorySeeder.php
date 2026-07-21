<?php

namespace Database\Seeders;

use App\Models\ItemCategory;
use Illuminate\Database\Seeder;

class ItemCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['code' => 'STAT', 'name_en' => 'Stationery', 'name_si' => 'ලියුම් පත්', 'icon' => 'pencil', 'color' => '#3B82F6'],
            ['code' => 'FURN', 'name_en' => 'Furniture', 'name_si' => 'වව්න්කලපඬයා', 'icon' => 'armchair', 'color' => '#8B5CF6'],
            ['code' => 'ELEC', 'name_en' => 'Electrical Equipment', 'name_si' => 'විද්යුත් කොපවල්', 'icon' => 'zap', 'color' => '#EAB308'],
            ['code' => 'MECH', 'name_en' => 'Mechanical Equipment', 'icon' => 'wrench', 'color' => '#6B7280'],
            ['code' => 'CHEM', 'name_en' => 'Chemicals', 'name_si' => 'රසයන්', 'icon' => 'flask', 'color' => '#10B981'],
            ['code' => 'CLEAN', 'name_en' => 'Cleaning Supplies', 'name_si' => 'පිරිශුදු ්ර්ශහස්ත්ර', 'icon' => 'sparkles', 'color' => '#06B6D4'],
            ['code' => 'COMP', 'name_en' => 'Computer & IT', 'name_si' => 'ගණකයෆාල  ්ේටි', 'icon' => 'monitor', 'color' => '#6366F1'],
            ['code' => 'VEHP', 'name_en' => 'Vehicle Parts', 'icon' => 'car', 'color' => '#F59E0B'],
            ['code' => 'CONS', 'name_en' => 'Construction Materials', 'name_si' => 'ඔසු විසින්', 'icon' => 'hard-hat', 'color' => '#EF4444'],
            ['code' => 'MED', 'name_en' => 'Medical Supplies', 'name_si' => 'වද් විසින්', 'icon' => 'heart-pulse', 'color' => '#EC4899'],
            ['code' => 'FOOD', 'name_en' => 'Food & Beverages', 'icon' => 'utensils', 'color' => '#F97316'],
            ['code' => 'UNIFM', 'name_en' => 'Uniforms & Clothing', 'icon' => 'shirt', 'color' => '#14B8A6'],
            ['code' => 'TOOLS', 'name_en' => 'Tools & Hardware', 'icon' => 'tool', 'color' => '#78716C'],
            ['code' => 'OTHER', 'name_en' => 'Other', 'name_si' => 'අන්ය', 'icon' => 'package', 'color' => '#9CA3AF'],
        ];

        foreach ($categories as $cat) {
            ItemCategory::firstOrCreate(['code' => $cat['code']], $cat);
        }
    }
}
