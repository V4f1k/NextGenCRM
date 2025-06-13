import { useState } from 'react'
import { Search, MapPin, Globe, Sparkles, RefreshCw, CheckSquare, AlertCircle, Info, Zap } from 'lucide-react'
import { useToastContext } from '../context/ToastContext'
import { apiService } from '../services/api'

interface CampaignConfig {
  keyword: string
  location: string
  max_results: number
  radius: number
  enable_ai_analysis: boolean
  enable_website_scraping: boolean
  enable_deduplication: boolean
}

interface GeneratedProspect {
  company_name: string
  contact_name?: string
  email_address?: string
  phone_number?: string
  website?: string
  location?: string
  industry?: string
  quality_score?: number
  validation_status?: string
  source_keyword?: string
  source_location?: string
}

interface CampaignResults {
  success: boolean
  prospects: GeneratedProspect[]
  total_found: number
  total_processed: number
  total_qualified: number
  services_used: string[]
  error?: string
}

export function LeadGeneration() {
  const [config, setConfig] = useState<CampaignConfig>({
    keyword: '',
    location: '',
    max_results: 20,
    radius: 5000,
    enable_ai_analysis: true,
    enable_website_scraping: true,
    enable_deduplication: true,
  })
  
  const [results, setResults] = useState<CampaignResults | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState('')
  
  const toast = useToastContext()

  const handleGenerateCampaign = async () => {
    if (!config.keyword || !config.location) {
      toast.error('Please provide both keyword and location')
      return
    }

    setIsGenerating(true)
    setCurrentStep('Initializing campaign...')
    setResults(null)

    try {
      setCurrentStep('Searching for businesses with Google Maps...')
      
      const response = await apiService.generateProspectsCampaign(config)
      
      if (response.success) {
        setResults(response)
        toast.success(
          `Campaign completed! Generated ${response.total_qualified} qualified prospects from ${response.total_found} businesses found.`
        )
      } else {
        throw new Error(response.error || 'Campaign failed')
      }
    } catch (error: any) {
      console.error('Campaign generation error:', error)
      toast.error('Campaign generation failed', {
        description: error.message || 'Unknown error occurred'
      })
    } finally {
      setIsGenerating(false)
      setCurrentStep('')
    }
  }

  const handleSaveProspects = async () => {
    if (!results?.prospects?.length) {
      toast.error('No prospects to save')
      return
    }

    try {
      // Create prospects in the database
      const prospectPromises = results.prospects.map(prospect => 
        apiService.createProspect({
          company_name: prospect.company_name,
          contact_name: prospect.contact_name || '',
          email_address: prospect.email_address || '',
          phone_number: prospect.phone_number || '',
          website: prospect.website || '',
          location: prospect.location || '',
          industry: prospect.industry || '',
          niche: config.keyword,
          description: `Generated from campaign: ${config.keyword} in ${config.location}`,
          status: 'new',
          validated: prospect.quality_score && prospect.quality_score > 70,
          auto_validation_score: prospect.quality_score || 0,
          validation_notes: `Campaign generation - Quality Score: ${prospect.quality_score || 0}`
        })
      )

      await Promise.all(prospectPromises)
      
      toast.success(`Saved ${results.prospects.length} prospects to database`)
      
      // Clear results after saving
      setResults(null)
    } catch (error: any) {
      console.error('Save prospects error:', error)
      toast.error('Failed to save prospects', {
        description: error.message
      })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Lead Generation Campaign</h1>
          <p className="text-gray-600 mt-1">
            Generate prospects using Google Maps, website scraping, ARES business registry, and AI analysis
          </p>
        </div>
      </div>

      {/* Campaign Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Search className="h-5 w-5 mr-2" />
          Campaign Configuration
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Type / Keyword *
            </label>
            <input
              type="text"
              value={config.keyword}
              onChange={(e) => setConfig({ ...config, keyword: e.target.value })}
              placeholder="e.g., restaurace, autoservis, lékárna"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isGenerating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              value={config.location}
              onChange={(e) => setConfig({ ...config, location: e.target.value })}
              placeholder="e.g., Praha, Brno, Ostrava"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isGenerating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Results
            </label>
            <input
              type="number"
              value={config.max_results}
              onChange={(e) => setConfig({ ...config, max_results: parseInt(e.target.value) || 20 })}
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isGenerating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Radius (meters)
            </label>
            <input
              type="number"
              value={config.radius}
              onChange={(e) => setConfig({ ...config, radius: parseInt(e.target.value) || 5000 })}
              min="100"
              max="50000"
              step="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Service Options */}
        <div className="mt-6">
          <h3 className="text-md font-medium text-gray-900 mb-3">Services to Enable</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enable_website_scraping}
                onChange={(e) => setConfig({ ...config, enable_website_scraping: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={isGenerating}
              />
              <Globe className="h-4 w-4 ml-2 mr-1 text-gray-600" />
              <span className="ml-1 text-sm text-gray-700">Website Scraping (extract contact info and business details)</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enable_ai_analysis}
                onChange={(e) => setConfig({ ...config, enable_ai_analysis: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={isGenerating}
              />
              <Sparkles className="h-4 w-4 ml-2 mr-1 text-gray-600" />
              <span className="ml-1 text-sm text-gray-700">AI Quality Analysis (OpenAI-powered prospect scoring)</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enable_deduplication}
                onChange={(e) => setConfig({ ...config, enable_deduplication: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={isGenerating}
              />
              <CheckSquare className="h-4 w-4 ml-2 mr-1 text-gray-600" />
              <span className="ml-1 text-sm text-gray-700">Deduplication (prevent duplicate prospects)</span>
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleGenerateCampaign}
            disabled={isGenerating || !config.keyword || !config.location}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate Campaign
              </>
            )}
          </button>
        </div>

        {/* Progress Indicator */}
        {isGenerating && currentStep && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin text-blue-600" />
              <span className="text-sm text-blue-800">{currentStep}</span>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Campaign Results</h2>
            <button
              onClick={handleSaveProspects}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Save to Prospects
            </button>
          </div>

          {/* Campaign Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-semibold text-gray-900">{results.total_found}</div>
              <div className="text-sm text-gray-600">Businesses Found</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-semibold text-gray-900">{results.total_processed}</div>
              <div className="text-sm text-gray-600">Processed</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-semibold text-green-600">{results.total_qualified}</div>
              <div className="text-sm text-gray-600">Qualified</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-semibold text-indigo-600">{results.services_used.length}</div>
              <div className="text-sm text-gray-600">Services Used</div>
            </div>
          </div>

          {/* Services Used */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Services Used:</h3>
            <div className="flex flex-wrap gap-2">
              {results.services_used.map((service) => (
                <span
                  key={service}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {service.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Prospects Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.prospects.map((prospect, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{prospect.company_name}</div>
                        <div className="text-sm text-gray-500">{prospect.industry}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{prospect.contact_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {prospect.email_address && (
                          <div>{prospect.email_address}</div>
                        )}
                        {prospect.phone_number && (
                          <div>{prospect.phone_number}</div>
                        )}
                        {prospect.website && (
                          <div className="text-indigo-600 hover:text-indigo-900">
                            <a href={prospect.website} target="_blank" rel="noopener noreferrer">
                              {prospect.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {prospect.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            (prospect.quality_score || 0) >= 80 
                              ? 'bg-green-100 text-green-800' 
                              : (prospect.quality_score || 0) >= 60 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {prospect.quality_score || 0}%
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">How Lead Generation Works</h3>
            <div className="mt-2 text-sm text-blue-800">
              <ol className="list-decimal list-inside space-y-1">
                <li><strong>Google Maps Search:</strong> Finds businesses matching your keyword and location</li>
                <li><strong>Website Scraping:</strong> Extracts contact information and business details from websites</li>
                <li><strong>ARES Integration:</strong> Enriches Czech businesses with official registry data</li>
                <li><strong>AI Analysis:</strong> Scores prospect quality and identifies target personas</li>
                <li><strong>Deduplication:</strong> Removes duplicates against existing prospects</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}