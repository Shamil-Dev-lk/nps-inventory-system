<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
class PurchaseOrder extends Model {
    use HasFactory, SoftDeletes;
    protected $fillable = ["po_number","purchase_request_id","supplier_id","order_date","expected_delivery_date","subtotal","discount_amount","tax_amount","total_amount","status","created_by","approved_by","approved_at","terms_conditions","remarks"];
    protected $casts = ["order_date"=>"date","expected_delivery_date"=>"date","approved_at"=>"datetime","subtotal"=>"decimal:2","total_amount"=>"decimal:2"];
    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function createdBy(): BelongsTo { return $this->belongsTo(User::class,"created_by"); }
    public function items(): HasMany { return $this->hasMany(PurchaseOrderItem::class); }
}