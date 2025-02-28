import React, { useState } from 'react';
import { FileText, Download, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const AIReportGenerator = ({ startDate, endDate, transactionData }) => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateReport = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await api.post('/ai/generate-report', {
                startDate,
                endDate,
                transactionData
            });
            setReport(response.data.report);
        } catch (err) {
            console.error('Error generating AI report:', err);
            setError('Failed to generate AI report');
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = () => {
        if (!report) return;
        
        // Create a blob with the report content
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary anchor element and click it to trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-report-${startDate}-to-${endDate}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">AI Financial Report</h3>
                <div className="flex gap-2">
                    <button
                        onClick={generateReport}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 disabled:bg-blue-300"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <FileText className="w-5 h-5" />
                                Generate Report
                            </>
                        )}
                    </button>
                    
                    {report && (
                        <button
                            onClick={downloadReport}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            Download
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 rounded-xl text-red-600">
                    {error}
                </div>
            )}

            {report ? (
                <div className="space-y-6">
                    <div className="p-6 bg-gray-50 rounded-xl">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">{report.title}</h2>
                        <p className="text-gray-600 mb-4">{report.dateRange}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-white rounded-lg border border-gray-200">
                                <h4 className="text-sm text-gray-500">Total Income</h4>
                                <p className="text-xl font-bold text-green-600">{report.summary.totalIncome}</p>
                            </div>
                            <div className="p-4 bg-white rounded-lg border border-gray-200">
                                <h4 className="text-sm text-gray-500">Total Expenses</h4>
                                <p className="text-xl font-bold text-red-600">{report.summary.totalExpenses}</p>
                            </div>
                            <div className="p-4 bg-white rounded-lg border border-gray-200">
                                <h4 className="text-sm text-gray-500">Net Savings</h4>
                                <p className="text-xl font-bold text-blue-600">{report.summary.netSavings}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Key Insights</h3>
                            <ul className="space-y-2">
                                {report.keyInsights.map((insight, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <div className="min-w-[6px] h-[6px] mt-[6px] rounded-full bg-blue-500" />
                                        <span className="text-gray-700">{insight}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Top Spending Categories</h3>
                            <div className="space-y-2">
                                {report.topCategories.map((category, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <span className="text-gray-700">{category.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{category.amount}</span>
                                            <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                                                {category.percentage}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Recommendations</h3>
                            <ul className="space-y-2">
                                {report.recommendations.map((recommendation, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <div className="min-w-[6px] h-[6px] mt-[6px] rounded-full bg-green-500" />
                                        <span className="text-gray-700">{recommendation}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            ) : !loading && (
                <div className="text-center p-6 bg-gray-50 rounded-xl">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-700 mb-1">No Report Generated</h3>
                    <p className="text-gray-500 mb-4">Generate a report to see your financial analysis</p>
                </div>
            )}
        </div>
    );
};

export default AIReportGenerator;