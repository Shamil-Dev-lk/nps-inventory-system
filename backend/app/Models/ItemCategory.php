<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ItemCategory extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code', 'name_en', 'name_si', 'name_ta',
        'parent_id', 'description', 'icon', 'color', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ItemCategory::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(ItemCategory::class, 'parent_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(Item::class, 'category_id');
    }

    public function getLocalizedNameAttribute(): string
    {
        $lang = app()->getLocale();
        return match ($lang) {
            'si' => $this->name_si ?? $this->name_en,
            'ta' => $this->name_ta ?? $this->name_en,
            default => $this->name_en,
        };
    }
}
