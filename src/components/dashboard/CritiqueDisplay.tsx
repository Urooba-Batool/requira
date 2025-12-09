import { CheckCircle, XCircle, AlertTriangle, Lightbulb, Target, BarChart3 } from 'lucide-react';

interface CritiqueDisplayProps {
  critique: string;
}

export const CritiqueDisplay = ({ critique }: CritiqueDisplayProps) => {
  // Parse markdown-style sections from the AI response
  const parseSection = (text: string, sectionTitle: string): string | null => {
    const regex = new RegExp(`\\*\\*${sectionTitle}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\*\\*[A-Z]|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  };

  const parseListItems = (text: string): string[] => {
    if (!text) return [];
    // Split by numbered items (1., 2., etc.) or bullet points (-, *, •)
    const items = text.split(/(?:\d+\.\s+|[-*•]\s+)/).filter(item => item.trim());
    return items.map(item => item.replace(/\n/g, ' ').trim()).filter(Boolean);
  };

  const parseRating = (text: string): { category: string; rating: string }[] => {
    const ratings: { category: string; rating: string }[] = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      // Match patterns like "- Functional: Complete" or "* Non-Functional: Partial"
      const match = line.match(/[-*•]\s*\*?\*?([^:*]+)\*?\*?:\s*\*?\*?(\w+)\*?\*?/);
      if (match) {
        ratings.push({ category: match[1].trim(), rating: match[2].trim() });
      }
    });
    
    return ratings;
  };

  const getRatingColor = (rating: string) => {
    const normalizedRating = rating.toLowerCase();
    if (normalizedRating.includes('complete') || normalizedRating.includes('excellent')) {
      return 'text-success bg-success/10 border-success/20';
    }
    if (normalizedRating.includes('partial') || normalizedRating.includes('good') || normalizedRating.includes('fair')) {
      return 'text-warning bg-warning/10 border-warning/20';
    }
    return 'text-destructive bg-destructive/10 border-destructive/20';
  };

  const getScoreColor = (score: string) => {
    const normalizedScore = score.toLowerCase();
    if (normalizedScore.includes('excellent')) return 'text-success';
    if (normalizedScore.includes('good')) return 'text-info';
    if (normalizedScore.includes('fair')) return 'text-warning';
    return 'text-destructive';
  };

  // Extract sections
  const completenessSection = parseSection(critique, 'Completeness Assessment') || 
                              parseSection(critique, '1\\. Completeness Assessment');
  const qualitySection = parseSection(critique, 'Quality Issues') || 
                         parseSection(critique, '2\\. Quality Issues');
  const recommendationsSection = parseSection(critique, 'Recommendations') || 
                                  parseSection(critique, '3\\. Recommendations');
  const riskSection = parseSection(critique, 'Risk Areas') || 
                      parseSection(critique, '4\\. Risk Areas');
  const overallSection = parseSection(critique, 'Overall Score') || 
                         parseSection(critique, '5\\. Overall Score');

  const completenessRatings = completenessSection ? parseRating(completenessSection) : [];
  const qualityItems = qualitySection ? parseListItems(qualitySection) : [];
  const recommendations = recommendationsSection ? parseListItems(recommendationsSection) : [];
  const risks = riskSection ? parseListItems(riskSection) : [];

  // Extract overall score
  const overallScoreMatch = overallSection?.match(/(Excellent|Good|Fair|Needs Work)/i);
  const overallScore = overallScoreMatch ? overallScoreMatch[1] : null;

  // If parsing failed, show formatted raw text
  const hasParsedContent = completenessRatings.length > 0 || qualityItems.length > 0 || 
                           recommendations.length > 0 || risks.length > 0;

  if (!hasParsedContent) {
    // Fallback: Format raw markdown with basic styling
    return (
      <div className="space-y-4">
        <div className="prose prose-sm max-w-none text-foreground">
          {critique.split('\n').map((line, idx) => {
            // Headers with **
            if (line.match(/^\*\*\d*\.?\s*[^*]+\*\*/)) {
              const headerText = line.replace(/\*\*/g, '').replace(/^\d+\.\s*/, '');
              return (
                <h4 key={idx} className="text-base font-semibold text-primary mt-4 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  {headerText}
                </h4>
              );
            }
            // Bullet points
            if (line.match(/^[-*•]\s+/)) {
              return (
                <p key={idx} className="text-sm text-muted-foreground ml-4 flex items-start gap-2 my-1">
                  <span className="text-primary mt-1.5">•</span>
                  <span>{line.replace(/^[-*•]\s+/, '')}</span>
                </p>
              );
            }
            // Numbered items
            if (line.match(/^\d+\.\s+/)) {
              return (
                <p key={idx} className="text-sm text-muted-foreground ml-4 my-1">
                  {line}
                </p>
              );
            }
            // Regular text
            if (line.trim()) {
              return (
                <p key={idx} className="text-sm text-muted-foreground my-1">
                  {line.replace(/\*\*/g, '')}
                </p>
              );
            }
            return null;
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score Banner */}
      {overallScore && (
        <div className={`flex items-center justify-between p-4 rounded-lg border ${getRatingColor(overallScore)}`}>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            <div>
              <p className="text-xs font-medium opacity-80">Overall Quality Score</p>
              <p className={`text-xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</p>
            </div>
          </div>
        </div>
      )}

      {/* Completeness Assessment */}
      {completenessRatings.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 font-semibold text-foreground">
            <Target className="w-4 h-4 text-primary" />
            Completeness Assessment
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {completenessRatings.map((item, idx) => (
              <div 
                key={idx} 
                className={`flex items-center justify-between p-3 rounded-lg border ${getRatingColor(item.rating)}`}
              >
                <span className="text-sm font-medium">{item.category}</span>
                <span className="text-xs font-bold uppercase">{item.rating}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quality Issues */}
      {qualityItems.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 font-semibold text-foreground">
            <XCircle className="w-4 h-4 text-destructive" />
            Quality Issues Identified
          </h4>
          <ul className="space-y-2">
            {qualityItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 p-3 bg-destructive/5 border border-destructive/10 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 font-semibold text-foreground">
            <Lightbulb className="w-4 h-4 text-warning" />
            Recommendations
          </h4>
          <ul className="space-y-2">
            {recommendations.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 p-3 bg-warning/5 border border-warning/10 rounded-lg">
                <span className="flex items-center justify-center w-5 h-5 bg-warning/20 text-warning text-xs font-bold rounded-full flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Areas */}
      {risks.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 font-semibold text-foreground">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            Risk Areas
          </h4>
          <ul className="space-y-2">
            {risks.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 p-3 bg-destructive/5 border border-destructive/10 rounded-lg">
                <span className="w-2 h-2 bg-destructive rounded-full flex-shrink-0 mt-1.5" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
