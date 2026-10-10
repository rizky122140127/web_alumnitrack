<?php

namespace App\Http\Controllers;

use App\Models\AlumniProfile;
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
            ->groupBy('graduation_year', 'current_status')
            ->orderBy('graduation_year', 'desc')
            ->get();

        // Build structured recap per angkatan
        $recap = [];
        $grandTotal = 0;

        foreach ($distribution as $row) {
            $year = $row->graduation_year;

            if (!isset($recap[$year])) {
                $recap[$year] = [
                    'graduation_year' => $year,
                    'total'           => 0,
                    'distribution'    => [],
                    'percentages'     => [],
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
            ->groupBy('current_status')
            ->get()
            ->pluck('total', 'current_status');

        $overallPercentages = [];
        foreach ($overallDistribution as $status => $count) {
            $overallPercentages[$status] = $grandTotal > 0
                ? round(($count / $grandTotal) * 100, 2)
                : 0;
        }

        return response()->json([
            'recap_per_year' => array_values($recap),
            'overall'        => [
                'total'        => $grandTotal,
                'distribution' => $overallDistribution,
                'percentages'  => $overallPercentages,
            ],
        ]);
    }
}
