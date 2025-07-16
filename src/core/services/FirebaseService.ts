import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  setDoc 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth, db, storage } from './firebase';

export class FirebaseService {
  // Authentication methods
  static async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  static async signUp(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // 사용자 프로필 문서 생성
      await this.createUserProfile(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  static async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  static onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // User Profile Management
  static async createUserProfile(user: User) {
    try {
      const userDoc = {
        email: user.email,
        displayName: user.displayName || '',
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now(),
        profileCompleted: false,
        preferences: {
          language: 'ko',
          notifications: true,
          dataSharing: false
        }
      };
      
      await setDoc(doc(db, 'users', user.uid), userDoc);
      console.log('✅ 사용자 프로필 생성 완료:', user.email);
      return userDoc;
    } catch (error) {
      console.error('❌ 사용자 프로필 생성 실패:', error);
      throw error;
    }
  }

  static async getUserProfile(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  static async updateUserProfile(userId: string, data: any) {
    try {
      // 먼저 문서가 존재하는지 확인
      const userDoc = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userDoc);
      
      if (!userSnapshot.exists()) {
        // 문서가 없으면 기본 프로필 생성
        console.log('🔧 사용자 프로필이 없어서 자동 생성 중...');
        const currentUser = auth.currentUser;
        if (currentUser) {
          await this.createUserProfile(currentUser);
        } else {
          // currentUser가 없으면 기본 프로필 생성
          await setDoc(userDoc, {
            email: 'unknown@example.com',
            displayName: '',
            createdAt: Timestamp.now(),
            lastLoginAt: Timestamp.now(),
            profileCompleted: false,
            preferences: {
              language: 'ko',
              notifications: true,
              dataSharing: false
            }
          });
        }
      }
      
      // 이제 문서가 존재하므로 업데이트
      await updateDoc(userDoc, {
        ...data,
        updatedAt: Timestamp.now()
      });
      console.log('✅ 사용자 프로필 업데이트 완료');
    } catch (error) {
      console.error('❌ 사용자 프로필 업데이트 실패:', error);
      throw error;
    }
  }

  // Health Reports Management
  static async saveHealthReport(userId: string, reportData: any) {
    try {
      const reportDoc = {
        userId,
        ...reportData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'healthReports'), reportDoc);
      console.log('✅ 건강 리포트 저장 완료:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ 건강 리포트 저장 실패:', error);
      throw error;
    }
  }

  static async getUserHealthReports(userId: string, limitCount: number = 50) {
    try {
      const q = query(
        collection(db, 'healthReports'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ 건강 리포트 조회 실패:', error);
      throw error;
    }
  }

  // Chat History Management
  static async saveChatMessage(userId: string, messageData: any) {
    try {
      const chatDoc = {
        userId,
        ...messageData,
        timestamp: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'chatHistory'), chatDoc);
      return docRef.id;
    } catch (error) {
      console.error('❌ 채팅 메시지 저장 실패:', error);
      throw error;
    }
  }

  static async getChatHistory(userId: string, limitCount: number = 100) {
    try {
      const q = query(
        collection(db, 'chatHistory'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ 채팅 히스토리 조회 실패:', error);
      throw error;
    }
  }

  // Device Management
  static async saveDeviceInfo(userId: string, deviceData: any) {
    try {
      const deviceDoc = {
        userId,
        ...deviceData,
        pairedAt: Timestamp.now(),
        lastSyncAt: Timestamp.now()
      };
      
      await setDoc(doc(db, 'devices', deviceData.serialNumber), deviceDoc);
      console.log('✅ 디바이스 정보 저장 완료:', deviceData.serialNumber);
    } catch (error) {
      console.error('❌ 디바이스 정보 저장 실패:', error);
      throw error;
    }
  }

  static async getUserDevices(userId: string) {
    try {
      const q = query(
        collection(db, 'devices'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ 사용자 디바이스 조회 실패:', error);
      throw error;
    }
  }

  // 기존 범용 메서드들...
  static async addDocument(collectionName: string, data: any) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Add document error:', error);
      throw error;
    }
  }

  static async getDocument(collectionName: string, docId: string) {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Get document error:', error);
      throw error;
    }
  }

  static async updateDocument(collectionName: string, docId: string, data: any) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Update document error:', error);
      throw error;
    }
  }

  static async deleteDocument(collectionName: string, docId: string) {
    try {
      await deleteDoc(doc(db, collectionName, docId));
    } catch (error) {
      console.error('Delete document error:', error);
      throw error;
    }
  }

  static async getDocuments(collectionName: string, filters?: any[]) {
    try {
      const collectionRef = collection(db, collectionName);
      
      if (filters && filters.length > 0) {
        const q = query(collectionRef, ...filters);
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else {
        const querySnapshot = await getDocs(collectionRef);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
    } catch (error) {
      console.error('Get documents error:', error);
      throw error;
    }
  }

  // Real-time subscriptions
  static subscribeToCollection(collectionName: string, callback: (data: any[]) => void, filters?: any[]) {
    try {
      const collectionRef = collection(db, collectionName);
      const q = filters ? query(collectionRef, ...filters) : collectionRef;
      
      return onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(data);
      });
    } catch (error) {
      console.error('Subscribe to collection error:', error);
      throw error;
    }
  }

  // File upload methods
  static async uploadFile(path: string, file: File) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  }

  static async deleteFile(path: string) {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  }

  // Measurement Sessions methods
  static async saveMeasurementSession(sessionData: any) {
    try {
      const docRef = await addDoc(collection(db, 'measurementSessions'), {
        ...sessionData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Save measurement session error:', error);
      throw error;
    }
  }

  static async getMeasurementSessions(filters: any[] = []) {
    try {
      const collectionRef = collection(db, 'measurementSessions');
      let q;
      
      if (filters.length > 0) {
        q = query(collectionRef, ...filters);
      } else {
        // 기본 정렬: 최신순
        q = query(collectionRef, orderBy('createdAt', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        sessionDate: doc.data().sessionDate?.toDate()
      }));
    } catch (error) {
      console.error('Get measurement sessions error:', error);
      throw error;
    }
  }

  static async getMeasurementSession(sessionId: string) {
    try {
      const docRef = doc(db, 'measurementSessions', sessionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          sessionDate: data.sessionDate?.toDate()
        };
      } else {
        throw new Error('Measurement session not found');
      }
    } catch (error) {
      console.error('Get measurement session error:', error);
      throw error;
    }
  }

  static async updateMeasurementSession(sessionId: string, updateData: any) {
    try {
      const docRef = doc(db, 'measurementSessions', sessionId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Update measurement session error:', error);
      throw error;
    }
  }

  static async deleteMeasurementSession(sessionId: string) {
    try {
      const docRef = doc(db, 'measurementSessions', sessionId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Delete measurement session error:', error);
      throw error;
    }
  }

  // Query helper methods
  static createWhereFilter(field: string, operator: any, value: any) {
    return where(field, operator, value);
  }

  static createOrderByFilter(field: string, direction: 'asc' | 'desc' = 'asc') {
    return orderBy(field, direction);
  }

  static createLimitFilter(limitCount: number) {
    return limit(limitCount);
  }
}

export default FirebaseService; 