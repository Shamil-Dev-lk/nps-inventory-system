<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class GoodsReceivedNote extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'goods_received_notes';

    protected $fillable = [
        'grn_number', 'purchase_order_id', 'supplier_id',
        'invoice_number', 'invoice_date', 'received_date',
        'warehouse_id', 'received_by', 'approved_by', 'approved_at',
        'subtotal', 'discount_amount', 'tax_amount', 'total_amount',
        'status', 'remarks',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'received_date' => 'date',
        'approved_at' => 'datetime',
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function warehouse(): BelongsTo { return $this->belongsTo(Warehouse::class); }
    public function purchaseOrder(): BelongsTo { return $this->belongsTo(PurchaseOrder::class); }
    public function receivedBy(): BelongsTo { return $this->belongsTo(User::class, 'received_by'); }
    public function approvedBy(): BelongsTo { return $this->belongsTo(User::class, 'approved_by'); }
    public function items(): HasMany { return $this->hasMany(GrnItem::class, 'grn_id'); }
    public function attachments(): HasMany { return $this->hasMany(GrnAttachment::class, 'grn_id'); }
}
