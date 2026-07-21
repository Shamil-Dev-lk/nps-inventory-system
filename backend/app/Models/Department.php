<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Department extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code', 'name_en', 'name_si', 'name_ta',
        'description', 'head_officer_id', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function headOfficer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'head_officer_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function stockIssues(): HasMany
    {
        return $this->hasMany(StockIssue::class);
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
