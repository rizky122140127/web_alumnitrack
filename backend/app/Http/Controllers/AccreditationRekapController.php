<?php

namespace App\Http\Controllers;

use App\Models\AlumniProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AccreditationRekapController extends Controller
{
    /**
     * Get accreditation recap — distribution of alumni statuses per graduation year.
     */
    public function index(): JsonResponse
    {
        // Get distribution counts per graduation_year and current_status
        $distribution = AlumniProfile::select(
            'graduation_year',
            'current_status',
            DB::raw('COUNT(*) as total')
        )
            ->whereHas('user', function ($query) {
                $query->where('role', 'alumni')
                    ->where('alumni_approval_status', 'approved');
            })
            ->groupBy('graduation_year', 'current_status')
            ->orderBy('graduation_year', 'desc')
            ->get();

        // Build structured recap per angkatan
        $recap = [];
        $grandTotal = 0;

        foreach ($distribution as $row) {
            $year = $row->graduation_year;

            if (! isset($recap[$year])) {
                $recap[$year] = [
                    'graduation_year' => $year,
                    'total' => 0,
                    'distribution' => [],
                    'percentages' => [],
                ];
            }

            $recap[$year]['distribution'][$row->current_status] = $row->total;
            $recap[$year]['total'] += $row->total;
            $grandTotal += $row->total;
        }

        // Calculate percentages
        foreach ($recap as &$yearData) {
            foreach ($yearData['distribution'] as $status => $count) {
                $yearData['percentages'][$status] = $yearData['total'] > 0
                    ? round(($count / $yearData['total']) * 100, 2)
                    : 0;
            }
        }

        // Overall summary
        $overallDistribution = AlumniProfile::select(
            'current_status',
            DB::raw('COUNT(*) as total')
        )
            ->whereHas('user', function ($query) {
                $query->where('role', 'alumni')
                    ->where('alumni_approval_status', 'approved');
            })
            ->groupBy('current_status')
            ->get()
            ->pluck('total', 'current_status');

        $overallPercentages = [];
        foreach ($overallDistribution as $status => $count) {
            $overallPercentages[$status] = $grandTotal > 0
                ? round(($count / $grandTotal) * 100, 2)
                : 0;
        }

        $totalAlumni = User::where('role', 'alumni')
            ->where('alumni_approval_status', 'approved')
            ->count();
        $respondedAlumni = User::where('role', 'alumni')
            ->where('alumni_approval_status', 'approved')
            ->whereHas('tracerAnswers')
            ->count();
        $topCampuses = AlumniProfile::select('campus_name', DB::raw('COUNT(*) as total'))
            ->whereHas('user', function ($query) {
                $query->where('role', 'alumni')
                    ->where('alumni_approval_status', 'approved');
            })
            ->where('current_status', 'mahasiswa')
            ->whereNotNull('campus_name')
            ->where('campus_name', '<>', '')
            ->groupBy('campus_name')
            ->orderByDesc('total')
            ->orderBy('campus_name')
            ->limit(10)
            ->get();

        return response()->json([
            'recap_per_year' => array_values($recap),
            'overall' => [
                'total' => $grandTotal,
                'distribution' => $overallDistribution,
                'percentages' => $overallPercentages,
            ],
            'response_rate' => [
                'total_alumni' => $totalAlumni,
                'responded_alumni' => $respondedAlumni,
                'percentage' => $totalAlumni > 0
                    ? round(($respondedAlumni / $totalAlumni) * 100, 2)
                    : 0,
            ],
            'top_campuses' => $topCampuses,
        ]);
    }
}
