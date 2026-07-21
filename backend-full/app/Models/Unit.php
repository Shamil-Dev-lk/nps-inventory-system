<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Unit extends Model {
    protected $fillable = ["code","name_en","name_si","name_ta","symbol","description","is_active"];
    protected $casts = ["is_active"=>"boolean"];
    public function items(): HasMany { return $this->hasMany(Item::class); }
}