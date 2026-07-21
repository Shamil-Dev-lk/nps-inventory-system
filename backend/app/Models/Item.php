<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Item extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'item_code', 'barcode', 'qr_code',
        'name_en', 'name_si', 'name_ta', 'description',
        'category_id', 'brand_id', 'model_id', 'unit_id',
        'purchase_price', 'average_cost', 'selling_price',
        'current_quantity', 'available_quantity', 'reserved_quantity',
        'minimum_stock', 'maximum_stock', 'reorder_level',
        'warehouse_id', 'shelf_id', 'bin_id',
        'batch_number', 'expiry_date', 'warranty_period', 'warranty_expiry',
        'thumbnail', 'is_consumable', 'is_serialized', 'track_expiry',
        'is_active', 'remarks', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'warranty_expiry' => 'date',
        'purchase_price' => 'decimal:2',
        'average_cost' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'current_quantity' => 'decimal:3',
        'available_quantity' => 'decimal:3',
        'reserved_quantity' => 'decimal:3',
        'minimum_stock' => 'decimal:3',
        'maximum_stock' => 'decimal:3',
        'reorder_level' => 'decimal:3',
        'is_consumable' => 'boolean',
        'is_serialized' => 'boolean',
        'track_expiry' => 'boolean',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function category(): BelongsTo { return $this->belongsTo(ItemCategory::class); }
    public function brand(): BelongsTo { return $this->belongsTo(Brand::class); }
    public function model(): BelongsTo { return $this->belongsTo(ItemModel::class); }
    public function unit(): BelongsTo { return $this->belongsTo(Unit::class); }
    public function warehouse(): BelongsTo { return $this->belongsTo(Warehouse::class); }
    public function shelf(): BelongsTo { return $this->belongsTo(Shelf::class); }
    public function bin(): BelongsTo { return $this->belongsTo(Bin::class); }
    public function images(): HasMany { return $this->hasMany(ItemImage::class)->orderBy('sort_order'); }
    public function attachments(): HasMany { return $this->hasMany(ItemAttachment::class); }
    public function ledgerEntries(): HasMany { return $this->hasMany(StockLedger::class); }

    // Accessors
    public function getLocalizedNameAttribute(): string
    {
        $lang = app()->getLocale();
        return match ($lang) {
            'si' => $this->name_si ?? $this->name_en,
            'ta' => $this->name_ta ?? $this->name_en,
            default => $this->name_en,
        };
    }

    public function getThumbnailUrlAttribute(): string
    {
        if ($this->thumbnail) {
            return asset('storage/' . $this->thumbnail);
        }
        return asset('images/item-placeholder.png');
    }

    public function getIsLowStockAttribute(): bool
    {
        return $this->current_quantity <= $this->reorder_level;
    }

    public function getIsOutOfStockAttribute(): bool
    {
        return $this->current_quantity <= 0;
    }

    public function getStockStatusAttribute(): string
    {
        if ($this->current_quantity <= 0) return 'out_of_stock';
        if ($this->current_quantity <= $this->reorder_level) return 'low_stock';
        if ($this->current_quantity >= $this->maximum_stock && $this->maximum_stock > 0) return 'overstocked';
        return 'in_stock';
    }

    // Scopes
    public function scopeLowStock($query)
    {
        return $query->whereColumn('current_quantity', '<=', 'reorder_level');
    }

    public function scopeOutOfStock($query)
    {
        return $query->where('current_quantity', '<=', 0);
    }

    public function scopeExpiringSoon($query, int $days = 30)
    {
        return $query->whereNotNull('expiry_date')
            ->whereBetween('expiry_date', [now(), now()->addDays($days)]);
    }
}
