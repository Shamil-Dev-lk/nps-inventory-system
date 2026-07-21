<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
class PurchaseRequest extends Model {
    use HasFactory, SoftDeletes;
    protected $fillable = ["pr_number","department_id","project_id","requested_by","required_date","purpose","priority","status","approved_by","approved_at","approval_remarks","remarks"];
    protected $casts = ["required_date"=>"date","approved_at"=>"datetime"];
    public function department(): BelongsTo { return $this->belongsTo(Department::class); }
    public function requestedBy(): BelongsTo { return $this->belongsTo(User::class,"requested_by"); }
    public function approvedBy(): BelongsTo { return $this->belongsTo(User::class,"approved_by"); }
    public function items(): HasMany { return $this->hasMany(PurchaseRequestItem::class); }
}