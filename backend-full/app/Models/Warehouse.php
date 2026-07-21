<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Warehouse extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code', 'name_en', 'name_si', 'name_ta',
        'address', 'manager_id', 'telephone',
        'capacity', 'is_main', 'is_active',
    ];

    protected $casts = [
        'is_main' => 'boolean',
        'is_active' => 'boolean',
        'capacity' => 'decimal:2',
    ];

    public function manager(): BelongsTo { return $this->belongsTo(User::class, 'manager_id'); }


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
