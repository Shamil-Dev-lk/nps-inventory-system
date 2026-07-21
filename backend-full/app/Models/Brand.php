<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Brand extends Model {
    use HasFactory, SoftDeletes;
    protected $fillable = ["code","name","logo","country","description","is_active"];
    protected $casts = ["is_active"=>"boolean"];
}