import { GitHubAPIClient } from './github-api-client'
import { Repository, IRepository } from './models/repository'
import { SecurityScan, ISecurityScan, IVulnerability } from './models/security-scan'

export interface ScanResult {
  vulnerabilities: IVulnerability[]
  riskScore: number
  scannedFiles: number
  totalFiles: number
}

export interface FileContent {
  path: string
  content: string
  size: number
}

export interface ScanOptions {
  maxFileSize?: number
  excludePatterns?: string[]
  includePatterns?: string[]
  maxFiles?: number
}

export class SecurityScanner {
  private githubClient: GitHubAPIClient
  private readonly defaultOptions: Required<ScanOptions> = {
    maxFileSize: 1024 * 1024,
    excludePatterns: [
      'node_modules/**',
      '.git/**',
      '*.min.js',
      '*.bundle.js',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.log'
    ],
    includePatterns: [
      '**/*.js',
      '**/*.ts',
      '**/*.jsx',
      '**/*.tsx',
      '**/*.py',
      '**/*.java',
      '**/*.php',
      '**/*.rb',
      '**/*.go',
      '**/*.rs',
      '**/*.cpp',
      '**/*.c',
      '**/*.h',
      '**/*.env*',
      '**/*.config.*',
      '**/*.json',
      '**/*.yaml',
      '**/*.yml',
      '**/*.xml',
      '**/*.properties',
      '**/*.ini',
      '**/*.conf'
    ],
    maxFiles: 500
  }

  constructor(githubClient: GitHubAPIClient) {
    this.githubClient = githubClient
  }

  public async scanRepository(repository: IRepository, options: ScanOptions = {}): Promise<ISecurityScan> {
    const scanOptions = { ...this.defaultOptions, ...options }
    const [owner, repo] = repository.fullName.split('/')

    const scan = new SecurityScan({
      repositoryId: repository._id,
      scanDate: new Date(),
      vulnerabilities: [],
      riskScore: 0,
      status: 'in_progress'
    })

    await scan.save()

    try {
      const scanResult = await this.performScan(owner, repo, scanOptions)
      
      scan.vulnerabilities = scanResult.vulnerabilities
      scan.riskScore = scanResult.riskScore
      scan.status = 'completed'
      
      await scan.save()
      
      repository.securityScore = 100 - scanResult.riskScore
      repository.lastScanDate = new Date()
      await repository.save()

      return scan
    } catch (error) {
      scan.status = 'failed'
      await scan.save()
      throw error
    }
  }

  private async performScan(owner: string, repo: string, options: Required<ScanOptions>): Promise<ScanResult> {
    const fileContents = await this.getRepositoryFiles(owner, repo, options)
    const vulnerabilities: IVulnerability[] = []

    for (const fileContent of fileContents) {
      const fileVulnerabilities = this.scanFileContent(fileContent)
      vulnerabilities.push(...fileVulnerabilities)
    }

    const riskScore = this.calculateRiskScore(vulnerabilities)

    return {
      vulnerabilities,
      riskScore,
      scannedFiles: fileContents.length,
      totalFiles: fileContents.length
    }
  }

  private async getRepositoryFiles(owner: string, repo: string, options: Required<ScanOptions>): Promise<FileContent[]> {
    const files: FileContent[] = []
    const processedPaths = new Set<string>()

    try {
      const repoTree = await this.githubClient.get(`/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`)
      
      if (!repoTree.tree) {
        return files
      }

      const eligibleFiles = repoTree.tree
        .filter((item: any) => item.type === 'blob')
        .filter((item: any) => this.shouldIncludeFile(item.path, options))
        .slice(0, options.maxFiles)

      for (const file of eligibleFiles) {
        if (processedPaths.has(file.path)) {
          continue
        }

        try {
          if (file.size && file.size > options.maxFileSize) {
            continue
          }

          const content = await this.githubClient.getRepositoryContent(owner, repo, file.path)
          
          files.push({
            path: file.path,
            content,
            size: file.size || content.length
          })

          processedPaths.add(file.path)
        } catch (error) {
          continue
        }
      }
    } catch (error) {
      throw new Error(`Failed to fetch repository files: ${error}`)
    }

    return files
  }

  private shouldIncludeFile(path: string, options: Required<ScanOptions>): boolean {
    const isExcluded = options.excludePatterns.some(pattern => 
      this.matchesPattern(path, pattern)
    )

    if (isExcluded) {
      return false
    }

    const isIncluded = options.includePatterns.some(pattern => 
      this.matchesPattern(path, pattern)
    )

    return isIncluded
  }

  private matchesPattern(path: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.')

    const regex = new RegExp(`^${regexPattern}$`, 'i')
    return regex.test(path)
  }

  private scanFileContent(fileContent: FileContent): IVulnerability[] {
    const vulnerabilities: IVulnerability[] = []
    const lines = fileContent.content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNumber = i + 1

      vulnerabilities.push(...this.detectEnvironmentVariables(line, fileContent.path, lineNumber))
      vulnerabilities.push(...this.detectAWSKeys(line, fileContent.path, lineNumber))
      vulnerabilities.push(...this.detectAPIKeys(line, fileContent.path, lineNumber))
      vulnerabilities.push(...this.detectPrivateKeys(line, fileContent.path, lineNumber))
    }

    return vulnerabilities
  }

  public detectEnvironmentVariables(content: string, filePath: string, lineNumber: number): IVulnerability[] {
    const vulnerabilities: IVulnerability[] = []
    
    const patterns = [
      {
        regex: /(?:^|[^a-zA-Z0-9_])([A-Z_][A-Z0-9_]*)\s*=\s*["']([^"'\s]{8,})["']/g,
        severity: 'medium' as const,
        description: 'Hardcoded environment variable detected'
      },
      {
        regex: /(?:password|secret|key|token|api_key|auth)\s*[:=]\s*["']([^"'\s]{6,})["']/gi,
        severity: 'high' as const,
        description: 'Hardcoded sensitive credential detected'
      },
      {
        regex: /process\.env\.([A-Z_][A-Z0-9_]*)\s*\|\|\s*["']([^"'\s]{6,})["']/g,
        severity: 'medium' as const,
        description: 'Environment variable with hardcoded fallback'
      }
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.regex.exec(content)) !== null) {
        vulnerabilities.push({
          type: 'env_var',
          severity: pattern.severity,
          file: filePath,
          line: lineNumber,
          description: pattern.description,
          suggestion: 'Move sensitive values to environment variables or secure configuration'
        })
      }
    }

    return vulnerabilities
  }

  public detectAWSKeys(content: string, filePath: string, lineNumber: number): IVulnerability[] {
    const vulnerabilities: IVulnerability[] = []
    
    const patterns = [
      {
        regex: /AKIA[0-9A-Z]{16}/g,
        severity: 'critical' as const,
        description: 'AWS Access Key ID detected'
      },
      {
        regex: /[A-Za-z0-9/+=]{40}/g,
        severity: 'critical' as const,
        description: 'Potential AWS Secret Access Key detected',
        validate: (match: string) => {
          return /^[A-Za-z0-9/+=]{40}$/.test(match) && 
                 !/^[0-9]+$/.test(match) &&
                 match.includes('/') || match.includes('+') || match.includes('=')
        }
      },
      {
        regex: /aws[_-]?(?:access[_-]?key|secret[_-]?key|session[_-]?token)\s*[:=]\s*["']([^"'\s]{16,})["']/gi,
        severity: 'critical' as const,
        description: 'AWS credential in configuration detected'
      }
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.regex.exec(content)) !== null) {
        if (pattern.validate && !pattern.validate(match[0])) {
          continue
        }

        vulnerabilities.push({
          type: 'aws_key',
          severity: pattern.severity,
          file: filePath,
          line: lineNumber,
          description: pattern.description,
          suggestion: 'Use AWS IAM roles, environment variables, or AWS Secrets Manager'
        })
      }
    }

    return vulnerabilities
  }

  public detectAPIKeys(content: string, filePath: string, lineNumber: number): IVulnerability[] {
    const vulnerabilities: IVulnerability[] = []
    
    const patterns = [
      {
        regex: /(?:api[_-]?key|token|secret)\s*[:=]\s*["']([a-zA-Z0-9_-]{20,})["']/gi,
        severity: 'high' as const,
        description: 'Generic API key or token detected'
      },
      {
        regex: /sk-[a-zA-Z0-9]{48}/g,
        severity: 'critical' as const,
        description: 'OpenAI API key detected'
      },
      {
        regex: /ghp_[a-zA-Z0-9]{36}/g,
        severity: 'critical' as const,
        description: 'GitHub Personal Access Token detected'
      },
      {
        regex: /gho_[a-zA-Z0-9]{36}/g,
        severity: 'critical' as const,
        description: 'GitHub OAuth Token detected'
      },
      {
        regex: /AIza[0-9A-Za-z_-]{35}/g,
        severity: 'high' as const,
        description: 'Google API key detected'
      },
      {
        regex: /[0-9a-f]{32}/g,
        severity: 'medium' as const,
        description: 'Potential MD5 hash or API key detected',
        validate: (match: string) => {
          return /^[0-9a-f]{32}$/.test(match) && 
                 !/^0+$/.test(match) &&
                 !/^f+$/.test(match)
        }
      }
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.regex.exec(content)) !== null) {
        if (pattern.validate && !pattern.validate(match[0])) {
          continue
        }

        vulnerabilities.push({
          type: 'api_key',
          severity: pattern.severity,
          file: filePath,
          line: lineNumber,
          description: pattern.description,
          suggestion: 'Store API keys in environment variables or secure key management systems'
        })
      }
    }

    return vulnerabilities
  }

  public detectPrivateKeys(content: string, filePath: string, lineNumber: number): IVulnerability[] {
    const vulnerabilities: IVulnerability[] = []
    
    const patterns = [
      {
        regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
        severity: 'critical' as const,
        description: 'RSA private key detected'
      },
      {
        regex: /-----BEGIN\s+DSA\s+PRIVATE\s+KEY-----/g,
        severity: 'critical' as const,
        description: 'DSA private key detected'
      },
      {
        regex: /-----BEGIN\s+EC\s+PRIVATE\s+KEY-----/g,
        severity: 'critical' as const,
        description: 'ECDSA private key detected'
      },
      {
        regex: /-----BEGIN\s+OPENSSH\s+PRIVATE\s+KEY-----/g,
        severity: 'critical' as const,
        description: 'OpenSSH private key detected'
      },
      {
        regex: /-----BEGIN\s+PGP\s+PRIVATE\s+KEY\s+BLOCK-----/g,
        severity: 'critical' as const,
        description: 'PGP private key detected'
      },
      {
        regex: /-----BEGIN\s+CERTIFICATE-----/g,
        severity: 'medium' as const,
        description: 'Certificate detected'
      }
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.regex.exec(content)) !== null) {
        vulnerabilities.push({
          type: 'private_key',
          severity: pattern.severity,
          file: filePath,
          line: lineNumber,
          description: pattern.description,
          suggestion: 'Remove private keys from repository and use secure key management'
        })
      }
    }

    return vulnerabilities
  }

  public calculateRiskScore(vulnerabilities: IVulnerability[]): number {
    if (vulnerabilities.length === 0) {
      return 0
    }

    const severityWeights = {
      low: 1,
      medium: 3,
      high: 7,
      critical: 15
    }

    const typeMultipliers = {
      env_var: 1.0,
      api_key: 1.2,
      aws_key: 1.5,
      private_key: 2.0
    }

    let totalScore = 0
    const severityCounts = { low: 0, medium: 0, high: 0, critical: 0 }

    for (const vulnerability of vulnerabilities) {
      const baseScore = severityWeights[vulnerability.severity]
      const typeMultiplier = typeMultipliers[vulnerability.type]
      const score = baseScore * typeMultiplier
      
      totalScore += score
      severityCounts[vulnerability.severity]++
    }

    const criticalPenalty = severityCounts.critical * 10
    const highPenalty = severityCounts.high * 5
    const mediumPenalty = severityCounts.medium * 2

    const finalScore = totalScore + criticalPenalty + highPenalty + mediumPenalty

    return Math.min(Math.round(finalScore), 100)
  }
}