/**
 * JSON 뷰어 컴포넌트
 * EEG Advanced 분석 결과를 JSON 형태로 표시
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Download, 
  FileText,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';

interface JsonViewerProps {
  data: any;
  title?: string;
  className?: string;
}

interface JsonNodeProps {
  data: any;
  keyName?: string;
  level?: number;
  isLast?: boolean;
}

export function JsonViewer({ data, title = "JSON 데이터", className = "" }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={`bg-white ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            {title}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRaw(!showRaw)}
              className="text-xs border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-800"
            >
              {showRaw ? (
                <>
                  <EyeOff className="w-4 h-4 mr-1" />
                  구조화 보기
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  원본 보기
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-800"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-green-600" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  복사
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="text-xs border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 hover:text-green-800"
            >
              <Download className="w-4 h-4 mr-1" />
              다운로드
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {showRaw ? (
          <pre className="bg-gray-50 border rounded-lg p-4 text-sm overflow-auto max-h-96 text-gray-800 font-mono">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <div className="bg-gray-50 border rounded-lg p-4 max-h-96 overflow-auto">
            <JsonNode data={data} level={0} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function JsonNode({ data, keyName, level = 0, isLast = true }: JsonNodeProps) {
  const [expanded, setExpanded] = useState(level < 2); // 첫 2레벨까지 자동 확장
  
  const indent = level * 16; // 16px per level
  const isExpandable = typeof data === 'object' && data !== null;
  const hasChildren = isExpandable && Object.keys(data).length > 0;
  
  const getValueType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const getValueBadgeColor = (type: string): string => {
    switch (type) {
      case 'string': return 'bg-green-100 text-green-800';
      case 'number': return 'bg-blue-100 text-blue-800';
      case 'boolean': return 'bg-purple-100 text-purple-800';
      case 'array': return 'bg-orange-100 text-orange-800';
      case 'object': return 'bg-gray-100 text-gray-800';
      case 'null': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderValue = (value: any) => {
    const type = getValueType(value);
    
    if (type === 'string') {
      return (
        <span className="text-green-700 font-medium">
          "{value}"
        </span>
      );
    }
    
    if (type === 'number') {
      return (
        <span className="text-blue-700 font-medium">
          {value}
        </span>
      );
    }
    
    if (type === 'boolean') {
      return (
        <span className="text-purple-700 font-medium">
          {value.toString()}
        </span>
      );
    }
    
    if (type === 'null') {
      return (
        <span className="text-gray-500 italic">
          null
        </span>
      );
    }
    
    return null;
  };

  const getCollectionInfo = (data: any) => {
    if (Array.isArray(data)) {
      return `Array(${data.length})`;
    }
    if (typeof data === 'object' && data !== null) {
      return `Object(${Object.keys(data).length})`;
    }
    return '';
  };

  if (!isExpandable) {
    return (
      <div 
        className="flex items-center gap-2 py-1"
        style={{ paddingLeft: `${indent}px` }}
      >
        {keyName && (
          <>
            <span className="text-gray-700 font-medium">
              {keyName}:
            </span>
            <Badge 
              variant="outline" 
              className={`text-xs px-1.5 py-0.5 ${getValueBadgeColor(getValueType(data))}`}
            >
              {getValueType(data)}
            </Badge>
          </>
        )}
        {renderValue(data)}
      </div>
    );
  }

  return (
    <div>
      <div 
        className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-100 rounded"
        style={{ paddingLeft: `${indent}px` }}
        onClick={() => setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )
        ) : (
          <div className="w-4" />
        )}
        
        {keyName && (
          <span className="text-gray-700 font-medium">
            {keyName}:
          </span>
        )}
        
        <Badge 
          variant="outline" 
          className={`text-xs px-1.5 py-0.5 ${getValueBadgeColor(getValueType(data))}`}
        >
          {getValueType(data)}
        </Badge>
        
        <span className="text-sm text-gray-500">
          {getCollectionInfo(data)}
        </span>
      </div>
      
      {expanded && hasChildren && (
        <div>
          {Array.isArray(data) ? (
            data.map((item, index) => (
              <JsonNode
                key={index}
                data={item}
                keyName={`[${index}]`}
                level={level + 1}
                isLast={index === data.length - 1}
              />
            ))
          ) : (
            Object.entries(data).map(([key, value], index, array) => (
              <JsonNode
                key={key}
                data={value}
                keyName={key}
                level={level + 1}
                isLast={index === array.length - 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default JsonViewer;