<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlumniProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nisn',
        'graduation_year',
        'current_status',
        'campus_name',
        'major_name',
        'company_name',
        'job_title',
    ];

    protected function casts(): array
    {
        return [
            'graduation_year' => 'integer',
        ];
    }

    // ── Relationships ───────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
