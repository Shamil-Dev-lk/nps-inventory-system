<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
class Payment extends Model {
    use SoftDeletes;
    protected $fillable = ["payment_number","supplier_invoice_id","supplier_id","payment_date","amount","payment_method","reference_number","bank_name","cheque_number","paid_by","approved_by","remarks"];
    protected $casts = ["payment_date"=>"date","amount"=>"decimal:2"];
    public function invoice(): BelongsTo { return $this->belongsTo(SupplierInvoice::class,"supplier_invoice_id"); }
    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
}