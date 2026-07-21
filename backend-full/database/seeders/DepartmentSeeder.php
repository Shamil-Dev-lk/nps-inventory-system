<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['code' => 'ADMIN', 'name_en' => 'Administration', 'name_si' => 'ප්රශාසනය'],
            ['code' => 'ACCT', 'name_en' => 'Accounts', 'name_si' => 'ගීනුම්'],
            ['code' => 'ENG', 'name_en' => 'Engineering', 'name_si' => 'ඊඤුරුම් විද්යාව'],
            ['code' => 'HLTH', 'name_en' => 'Health', 'name_si' => 'ආරෝග්ය'],
            ['code' => 'ROAD', 'name_en' => 'Roads & Development', 'name_si' => 'මාර්ග  වව්න්කම'],
            ['code' => 'STORE', 'name_en' => 'Store', 'name_si' => 'ග්රාම'],
            ['code' => 'PLAN', 'name_en' => 'Planning', 'name_si' => 'වින්යවීම'],
            ['code' => 'REV', 'name_en' => 'Revenue', 'name_si' => 'උපාරම'],
        ];

        foreach ($departments as $dept) {
            Department::firstOrCreate(['code' => $dept['code']], $dept);
        }
    }
}
