/**
 * 조직 구조 탭 컴포넌트
 * 
 * 부서 계층 구조를 시각화하고 관리하는 인터페이스
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import { Badge } from '@ui/badge'
import { 
  Network, 
  Plus, 
  Loader2, 
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Building2,
  Users,
  MoreHorizontal,
  User
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ui/dropdown-menu"
import { toast } from 'sonner'
import organizationManagementService from '@domains/organization/services/management/OrganizationManagementService'
import type { DepartmentNode, CreateDepartmentData, Department } from '@domains/organization/types/management/organization-management'
import DepartmentFormModal from '../components/DepartmentFormModal'

interface OrganizationStructureTabProps {
  organizationId: string
}

interface DepartmentTreeItemProps {
  node: DepartmentNode
  level: number
  onToggle: (nodeId: string) => void
  onEdit: (nodeId: string) => void
  onDelete: (nodeId: string) => void
  onAddChild: (parentId: string) => void
}

// Department Tree Item Component
function DepartmentTreeItem({ 
  node, 
  level, 
  onToggle, 
  onEdit, 
  onDelete, 
  onAddChild 
}: DepartmentTreeItemProps) {
  const hasChildren = node.children.length > 0
  const isExpanded = node.isExpanded ?? true

  return (
    <div className="w-full">
      {/* Department Card */}
      <div 
        className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
        style={{ marginLeft: `${level * 24}px` }}
      >
        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle(node.id)}
          className="w-6 h-6 p-0 hover:bg-slate-100 text-slate-600"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </Button>

        {/* Department Icon */}
        <div className="p-2 bg-blue-50 rounded">
          <Building2 className="w-4 h-4 text-blue-600" />
        </div>

        {/* Department Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-slate-900 truncate">{node.name}</h4>
            <Badge variant="outline" className="text-xs text-slate-700 border-slate-300">
              {node.code}
            </Badge>
            {node.level === 0 && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                최상위
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400" />
              <span className="text-slate-600">{node.memberCount}명</span>
            </div>
            {node.managerName && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                <span className="text-slate-600">{node.managerName}</span>
              </div>
            )}
            {hasChildren && (
              <div className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span className="text-slate-600">{node.children.length}개 하위부서</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-8 h-8 p-0 hover:bg-slate-100 text-slate-600 hover:text-slate-900"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(node.id)}>
              <Edit2 className="w-4 h-4 mr-2" />
              수정
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddChild(node.id)}>
              <Plus className="w-4 h-4 mr-2" />
              하위 부서 추가
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(node.id)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <DepartmentTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function OrganizationStructureTab({ organizationId }: OrganizationStructureTabProps) {
  const [departments, setDepartments] = useState<DepartmentNode[]>([])
  const [flatDepartments, setFlatDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  
  // Modal states
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false)
  const [departmentModalMode, setDepartmentModalMode] = useState<'create' | 'edit'>('create')
  const [selectedDepartment, setSelectedDepartment] = useState<Department | undefined>()
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>()
  
  

  useEffect(() => {
    loadDepartmentHierarchy()
  }, [organizationId])

  const loadDepartmentHierarchy = async () => {
    try {
      setLoading(true)
      const hierarchy = await organizationManagementService.getDepartmentHierarchy(organizationId)
      const flatList = await organizationManagementService.getDepartments(organizationId)
      
      // Set all nodes as expanded by default
      const allNodeIds = new Set<string>()
      const collectNodeIds = (nodes: DepartmentNode[]) => {
        nodes.forEach(node => {
          allNodeIds.add(node.id)
          node.isExpanded = true
          collectNodeIds(node.children)
        })
      }
      collectNodeIds(hierarchy)
      setExpandedNodes(allNodeIds)
      
      setDepartments(hierarchy)
      setFlatDepartments(flatList)
    } catch (error) {
      console.error('Failed to load departments:', error)
      toast.error('부서 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // Toggle node expansion
  const handleToggleNode = (nodeId: string) => {
    const newExpandedNodes = new Set(expandedNodes)
    const updateNodeExpansion = (nodes: DepartmentNode[]): DepartmentNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          const isExpanded = !node.isExpanded
          node.isExpanded = isExpanded
          
          if (isExpanded) {
            newExpandedNodes.add(nodeId)
          } else {
            newExpandedNodes.delete(nodeId)
          }
        }
        
        if (node.children.length > 0) {
          node.children = updateNodeExpansion(node.children)
        }
        
        return node
      })
    }
    
    setDepartments(prevDepts => updateNodeExpansion([...prevDepts]))
    setExpandedNodes(newExpandedNodes)
  }

  // Handle department actions
  const handleEditDepartment = (departmentId: string) => {
    const department = flatDepartments.find(d => d.id === departmentId)
    if (department) {
      setSelectedDepartment(department)
      setDepartmentModalMode('edit')
      setSelectedParentId(undefined)
      setDepartmentModalOpen(true)
    }
  }

  const handleDeleteDepartment = async (departmentId: string) => {
    try {
      await organizationManagementService.deleteDepartment(organizationId, departmentId)
      toast.success('부서가 성공적으로 삭제되었습니다.')
      loadDepartmentHierarchy()
    } catch (error) {
      console.error('Failed to delete department:', error)
      toast.error('부서 삭제에 실패했습니다.')
    }
  }

  const handleAddDepartment = (parentId?: string) => {
    setSelectedDepartment(undefined)
    setDepartmentModalMode('create')
    setSelectedParentId(parentId)
    setDepartmentModalOpen(true)
  }

  // Modal handlers
  const handleDepartmentModalClose = () => {
    setDepartmentModalOpen(false)
    setSelectedDepartment(undefined)
    setSelectedParentId(undefined)
  }

  const handleDepartmentModalSuccess = async () => {
    // Force reload without cache
    setLoading(true)
    await loadDepartmentHierarchy()
  }

  // Calculate statistics
  const totalDepartments = () => {
    const countDepartments = (nodes: DepartmentNode[]): number => {
      return nodes.reduce((count, node) => {
        return count + 1 + countDepartments(node.children)
      }, 0)
    }
    return countDepartments(departments)
  }

  const totalMembers = () => {
    const countMembers = (nodes: DepartmentNode[]): number => {
      return nodes.reduce((count, node) => {
        return count + node.memberCount + countMembers(node.children)
      }, 0)
    }
    return countMembers(departments)
  }

  const maxDepth = () => {
    const getMaxDepth = (nodes: DepartmentNode[], currentDepth = 0): number => {
      if (nodes.length === 0) return currentDepth
      return Math.max(...nodes.map(node => 
        Math.max(currentDepth + 1, getMaxDepth(node.children, currentDepth + 1))
      ))
    }
    return getMaxDepth(departments)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">조직 구조</h2>
          <p className="text-sm text-slate-600 mt-1">
            부서 계층 구조를 관리하고 조직도를 확인할 수 있습니다.
          </p>
        </div>
        <Button 
          onClick={() => handleAddDepartment()} 
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          부서 추가
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">전체 부서</p>
              <p className="text-2xl font-bold text-slate-900">{totalDepartments()}</p>
            </div>
            <Building2 className="w-8 h-8 text-slate-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">최상위 부서</p>
              <p className="text-2xl font-bold text-blue-600">{departments.length}</p>
            </div>
            <Network className="w-8 h-8 text-blue-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">전체 구성원</p>
              <p className="text-2xl font-bold text-green-600">{totalMembers()}</p>
            </div>
            <Users className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">조직 깊이</p>
              <p className="text-2xl font-bold text-purple-600">{maxDepth()}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">L{maxDepth()}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Organization Tree */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <Network className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-slate-900">부서 조직도</CardTitle>
              <CardDescription className="text-slate-900">
                각 부서를 클릭하여 하위 부서를 펼치거나 접을 수 있습니다
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-600">조직도를 불러오는 중...</span>
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">부서가 없습니다</h3>
              <p className="text-slate-600 mb-4">첫 번째 부서를 추가해보세요.</p>
              <Button 
                onClick={() => handleAddDepartment()} 
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                부서 추가
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {departments.map((department) => (
                <DepartmentTreeItem
                  key={department.id}
                  node={department}
                  level={0}
                  onToggle={handleToggleNode}
                  onEdit={handleEditDepartment}
                  onDelete={handleDeleteDepartment}
                  onAddChild={handleAddDepartment}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department Form Modal */}
      <DepartmentFormModal
        isOpen={departmentModalOpen}
        onClose={handleDepartmentModalClose}
        onSuccess={handleDepartmentModalSuccess}
        organizationId={organizationId}
        department={selectedDepartment}
        departments={flatDepartments}
        mode={departmentModalMode}
        parentId={selectedParentId}
      />
    </div>
  )
}