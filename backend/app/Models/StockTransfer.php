<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class StockTransfer extends Model {
    use HasFactory, SoftDeletes;
    protected $fillable = ["transfer_number","transfer_type","from_warehouse_id","to_warehouse_id","from_department_id","to_department_id","transfer_date","initiated_by","approved_by","approved_at","status","reason","remarks"];
    protected $casts = ["transfer_date"=>"date","approved_at"=>"datetime"];
}