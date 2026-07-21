<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockIssue extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'issue_number', 'issue_to_type',
        'department_id', 'officer_id', 'project_id',
        'warehouse_id', 'issue_date',
        'issued_by', 'approved_by', 'approved_at',
        'purpose', 'recipient_signature', 'status', 'remarks',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'approved_at' => 'datetime',
    ];

    public function department(): BelongsTo { return $this->belongsTo(Department::class); }
    public function officer(): BelongsTo { return $this->belongsTo(User::class, 'officer_id'); }
    public function project(): BelongsTo { return $this->belongsTo(Project::class); }
    public function warehouse(): BelongsTo { return $this->belongsTo(Warehouse::class); }
    public function issuedBy(): BelongsTo { return $this->belongsTo(User::class, 'issued_by'); }
    public function approvedBy(): BelongsTo { return $this->belongsTo(User::class, 'approved_by'); }
    public function items(): HasMany { return $this->hasMany(StockIssueItem::class); }
}
