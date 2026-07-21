<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Shelf extends Model {
    protected $fillable = ["warehouse_id","code","name","description","is_active"];
    public function warehouse(): BelongsTo { return $this->belongsTo(Warehouse::class); }
    public function bins(): HasMany { return $this->hasMany(Bin::class); }
}