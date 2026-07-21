<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
class SupplierInvoice extends Model {
    use SoftDeletes;
    protected $fillable = ["invoice_number","supplier_invoice_number","supplier_id","grn_id","invoice_date","due_date","subtotal","tax_amount","discount_amount","total_amount","paid_amount","balance_amount","status","remarks"];
    protected $casts = ["invoice_date"=>"date","due_date"=>"date"];
    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function payments(): HasMany { return $this->hasMany(Payment::class,"supplier_invoice_id"); }
}