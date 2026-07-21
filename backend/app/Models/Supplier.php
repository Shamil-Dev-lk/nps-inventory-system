<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'supplier_code', 'company_name', 'contact_person',
        'address', 'district', 'province',
        'telephone', 'mobile', 'email', 'fax', 'website',
        'vat_number', 'br_number',
        'bank_name', 'bank_branch', 'bank_account_number', 'bank_account_name',
        'remarks', 'status',
    ];

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function goodsReceivedNotes(): HasMany
    {
        return $this->hasMany(GoodsReceivedNote::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(SupplierInvoice::class);
    }
}
