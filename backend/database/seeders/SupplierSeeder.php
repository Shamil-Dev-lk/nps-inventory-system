<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            [
                'supplier_code' => 'SUP-0001',
                'company_name' => 'Cargills Ceylon PLC',
                'contact_person' => 'John Perera',
                'address' => 'Colombo 03, Sri Lanka',
                'district' => 'Colombo',
                'telephone' => '+94 11 2303000',
                'email' => 'procurement@cargills.lk',
                'vat_number' => 'VAT-001234',
                'status' => 'active',
            ],
            [
                'supplier_code' => 'SUP-0002',
                'company_name' => 'Lanka Stationers Ltd',
                'contact_person' => 'Saman Silva',
                'address' => 'Kurunegala, Sri Lanka',
                'district' => 'Kurunegala',
                'telephone' => '+94 37 2222222',
                'email' => 'orders@lankastationers.lk',
                'status' => 'active',
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::firstOrCreate(['supplier_code' => $supplier['supplier_code']], $supplier);
        }
    }
}
