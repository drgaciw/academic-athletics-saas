import { ChatOpenAI } from '@langchain/openai'
import { prisma } from '@aah/database'
import { RiskPrediction } from '../types'
import { AI_CONFIG } from '../config'

export class PredictiveAnalyticsService {
  private llm: ChatOpenAI

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: AI_CONFIG.models.advanced,
      temperature: 0.3,
      openAIApiKey: AI_CONFIG.openai.apiKey,
    })
  }

  /**
   * Predict student risk based on comprehensive data
   */
  async predictRisk(
    studentId: string,
    options: {
      includeRecommendations?: boolean
      timeframe?: 'current' | 'semester' | 'year'
    } = {}
  ): Promise<RiskPrediction> {
    // Gather student data
    const studentData = await this.gatherStudentData(studentId)

    // Calculate risk factors
    const factors = this.calculateRiskFactors(studentData)

    // Determine overall risk
    const overallRisk = this.determineOverallRisk(factors)

    // Generate predictions
    const predictions = this.generatePredictions(studentData, factors)

    // Generate recommendations if requested
    const recommendations =
      options.includeRecommendations !== false
        ? await this.generateRecommendations(studentData, factors)
        : []

    // Store prediction in database
    await prisma.studentPrediction.create({
      data: {
        userId: studentData.userId,
        predictionType: 'risk_assessment',
        result: {
          overallRisk,
          riskScore: this.calculateRiskScore(factors),
          factors,
          predictions,
        },
      },
    })

    return {
      studentId,
      overallRisk,
      riskScore: this.calculateRiskScore(factors),
      factors,
      predictions,
      recommendations,
      generatedAt: new Date(),
    }
  }

  /**
   * Gather comprehensive student data
   */
  private async gatherStudentData(studentId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { studentId },
      include: {
        user: true,
        complianceRecords: {
          orderBy: { checkedAt: 'desc' },
          take: 5,
        },
        performanceMetrics: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
        alerts: {
          where: { status: 'ACTIVE' },
        },
        progressReports: {
          orderBy: { submittedAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!profile) {
      throw new Error('Student not found')
    }

    return {
      userId: profile.userId,
      studentId: profile.studentId,
      sport: profile.sport,
      gpa: profile.gpa || 0,
      creditHours: profile.creditHours,
      eligibilityStatus: profile.eligibilityStatus,
      academicStanding: profile.academicStanding || 'GOOD_STANDING',
      complianceRecords: profile.complianceRecords,
      performanceMetrics: profile.performanceMetrics,
      activeAlerts: profile.alerts,
      progressReports: profile.progressReports,
    }
  }

  /**
   * Calculate risk factors
   */
  private calculateRiskFactors(studentData: any): RiskPrediction['factors'] {
    const factors: RiskPrediction['factors'] = []

    // Academic risk factors
    if (studentData.gpa < 2.0) {
      factors.push({
        category: 'academic',
        factor: 'Low GPA',
        impact: 0.9,
        trend: 'declining',
      })
    } else if (studentData.gpa < 2.5) {
      factors.push({
        category: 'academic',
        factor: 'Below average GPA',
        impact: 0.6,
        trend: 'stable',
      })
    }

    // Credit hours
    if (studentData.creditHours < 12) {
      factors.push({
        category: 'academic',
        factor: 'Insufficient credit hours',
        impact: 0.8,
        trend: 'stable',
      })
    }

    // Attendance (from performance metrics)
    const recentMetrics = studentData.performanceMetrics.slice(0, 5)
    const avgAttendance =
      recentMetrics.reduce((sum: number, m: any) => sum + (m.attendanceRate || 100), 0) /
      Math.max(recentMetrics.length, 1)

    if (avgAttendance < 80) {
      factors.push({
        category: 'attendance',
        factor: 'Low class attendance',
        impact: 0.7,
        trend: avgAttendance < 70 ? 'declining' : 'stable',
      })
    }

    // Compliance status
    if (studentData.eligibilityStatus === 'AT_RISK') {
      factors.push({
        category: 'compliance',
        factor: 'Eligibility at risk',
        impact: 0.95,
        trend: 'declining',
      })
    }

    // Active alerts
    if (studentData.activeAlerts.length > 0) {
      factors.push({
        category: 'behavioral',
        factor: `${studentData.activeAlerts.length} active alerts`,
        impact: Math.min(studentData.activeAlerts.length * 0.2, 0.8),
        trend: 'declining',
      })
    }

    // Progress reports
    const negativeReports = studentData.progressReports.filter(
      (r: any) => r.status === 'NEEDS_IMPROVEMENT' || r.status === 'FAILING'
    )
    if (negativeReports.length > 0) {
      factors.push({
        category: 'academic',
        factor: 'Negative progress reports',
        impact: Math.min(negativeReports.length * 0.15, 0.7),
        trend: 'declining',
      })
    }

    return factors
  }

  /**
   * Determine overall risk level
   */
  private determineOverallRisk(
    factors: RiskPrediction['factors']
  ): 'low' | 'medium' | 'high' | 'critical' {
    const riskScore = this.calculateRiskScore(factors)

    if (riskScore >= 0.8) return 'critical'
    if (riskScore >= 0.6) return 'high'
    if (riskScore >= 0.4) return 'medium'
    return 'low'
  }

  /**
   * Calculate numeric risk score (0-1)
   */
  private calculateRiskScore(factors: RiskPrediction['factors']): number {
    if (factors.length === 0) return 0

    // Weighted average of impacts
    const totalImpact = factors.reduce((sum, f) => sum + f.impact, 0)
    return Math.min(totalImpact / factors.length, 1)
  }

  /**
   * Generate predictions
   */
  private generatePredictions(studentData: any, factors: RiskPrediction['factors']) {
    const riskScore = this.calculateRiskScore(factors)

    // Simple prediction model
    // In production, use ML models trained on historical data
    const graduationLikelihood = Math.max(0, Math.min(1, 0.9 - riskScore * 0.8))
    const eligibilityRisk = Math.min(1, riskScore * 1.2)
    const academicSuccessProbability = Math.max(0, Math.min(1, 0.85 - riskScore * 0.7))

    return {
      graduationLikelihood,
      eligibilityRisk,
      academicSuccessProbability,
    }
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateRecommendations(
    studentData: any,
    factors: RiskPrediction['factors']
  ): Promise<RiskPrediction['recommendations']> {
    const prompt = AI_CONFIG.promptTemplates.riskAssessment
      .replace('{academicData}', JSON.stringify({ gpa: studentData.gpa, creditHours: studentData.creditHours }))
      .replace('{attendanceData}', JSON.stringify(studentData.performanceMetrics))
      .replace('{complianceData}', JSON.stringify({ status: studentData.eligibilityStatus }))
      .replace('{supportData}', JSON.stringify({ alerts: studentData.activeAlerts.length }))

    try {
      const result = await this.llm.invoke(prompt)
      const response = result.content.toString()

      // Parse recommendations from response
      return this.parseRecommendations(response, factors)
    } catch (error) {
      console.error('Error generating recommendations:', error)
      // Return default recommendations
      return this.getDefaultRecommendations(factors)
    }
  }

  /**
   * Parse AI recommendations
   */
  private parseRecommendations(
    response: string,
    factors: RiskPrediction['factors']
  ): RiskPrediction['recommendations'] {
    const recommendations: RiskPrediction['recommendations'] = []

    // Extract numbered recommendations
    const lines = response.split('\n')
    for (const line of lines) {
      const match = line.match(/^\d+\.\s+(.+)/)
      if (match) {
        const text = match[1].trim()
        const priority = this.determinePriority(text, factors)

        recommendations.push({
          priority,
          action: text,
          expectedImpact: this.estimateImpact(text),
        })
      }
    }

    return recommendations.slice(0, 5) // Top 5 recommendations
  }

  /**
   * Determine recommendation priority
   */
  private determinePriority(
    recommendation: string,
    factors: RiskPrediction['factors']
  ): 'high' | 'medium' | 'low' {
    const lower = recommendation.toLowerCase()

    if (
      lower.includes('immediate') ||
      lower.includes('urgent') ||
      lower.includes('critical') ||
      factors.some((f) => f.impact > 0.8)
    ) {
      return 'high'
    }

    if (lower.includes('important') || factors.some((f) => f.impact > 0.5)) {
      return 'medium'
    }

    return 'low'
  }

  /**
   * Estimate impact of recommendation
   */
  private estimateImpact(recommendation: string): string {
    const lower = recommendation.toLowerCase()

    if (lower.includes('tutor') || lower.includes('advising')) {
      return 'High - Can improve academic performance by 15-25%'
    }

    if (lower.includes('attendance') || lower.includes('study hall')) {
      return 'Medium - Can improve outcomes by 10-20%'
    }

    return 'Low to Medium - Supportive measure'
  }

  /**
   * Get default recommendations based on risk factors
   */
  private getDefaultRecommendations(
    factors: RiskPrediction['factors']
  ): RiskPrediction['recommendations'] {
    const recommendations: RiskPrediction['recommendations'] = []

    const hasAcademicRisk = factors.some((f) => f.category === 'academic' && f.impact > 0.5)
    const hasAttendanceRisk = factors.some((f) => f.category === 'attendance')
    const hasComplianceRisk = factors.some((f) => f.category === 'compliance')

    if (hasAcademicRisk) {
      recommendations.push({
        priority: 'high',
        action: 'Schedule immediate tutoring sessions for struggling courses',
        expectedImpact: 'Can improve GPA by 0.3-0.5 points',
      })
    }

    if (hasAttendanceRisk) {
      recommendations.push({
        priority: 'high',
        action: 'Implement mandatory study hall attendance',
        expectedImpact: 'Improves class attendance by 20-30%',
      })
    }

    if (hasComplianceRisk) {
      recommendations.push({
        priority: 'high',
        action: 'Meet with academic advisor and compliance officer',
        expectedImpact: 'Ensures eligibility requirements are met',
      })
    }

    recommendations.push({
      priority: 'medium',
      action: 'Enroll in time management workshop',
      expectedImpact: 'Helps balance athletic and academic commitments',
    })

    return recommendations
  }
}

export const predictiveAnalytics = new PredictiveAnalyticsService()
