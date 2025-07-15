import React, { useState, useEffect } from 'react';
import { FirebaseService } from '@core/services';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';

interface UserData {
  id?: string;
  name: string;
  email: string;
  age: number;
  createdAt?: any;
  updatedAt?: any;
}

const FirebaseExample: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [newUser, setNewUser] = useState<Omit<UserData, 'id'>>({
    name: '',
    email: '',
    age: 0
  });
  const [loading, setLoading] = useState(false);

  // 사용자 목록 불러오기
  const loadUsers = async () => {
    try {
      setLoading(true);
      const userData = await FirebaseService.getDocuments('users');
      setUsers(userData as UserData[]);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  // 새 사용자 추가
  const addUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.age) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      await FirebaseService.addDocument('users', newUser);
      setNewUser({ name: '', email: '', age: 0 });
      await loadUsers(); // 목록 새로고침
    } catch (error) {
      console.error('Failed to add user:', error);
      alert('사용자 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 사용자 삭제
  const deleteUser = async (userId: string) => {
    try {
      setLoading(true);
      await FirebaseService.deleteDocument('users', userId);
      await loadUsers(); // 목록 새로고침
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('사용자 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 실시간 데이터 구독 (옵션)
  useEffect(() => {
    const unsubscribe = FirebaseService.subscribeToCollection('users', (data) => {
      setUsers(data as UserData[]);
    });

    // 컴포넌트 언마운트 시 구독 해제
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Firebase 사용 예제</h1>
      
      {/* 새 사용자 추가 폼 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>새 사용자 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="이름"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
            <Input
              placeholder="이메일"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
            <Input
              placeholder="나이"
              type="number"
              value={newUser.age || ''}
              onChange={(e) => setNewUser({ ...newUser, age: parseInt(e.target.value) || 0 })}
            />
            <Button onClick={addUser} disabled={loading}>
              {loading ? '추가 중...' : '사용자 추가'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 사용자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
          <Button onClick={loadUsers} disabled={loading} variant="outline">
            {loading ? '로딩 중...' : '새로고침'}
          </Button>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-gray-500">등록된 사용자가 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-sm text-gray-500">나이: {user.age}세</p>
                  </div>
                  <Button 
                    onClick={() => user.id && deleteUser(user.id)} 
                    variant="destructive"
                    disabled={loading}
                  >
                    삭제
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FirebaseExample; 