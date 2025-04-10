import React, { useState, useEffect, useRef } from 'react';
import { ChakraProvider, Container, VStack, useDisclosure, Text, Box, Tabs, TabList, TabPanels, Tab, TabPanel, Heading, useToast, Button } from '@chakra-ui/react';
import { useHotkeys } from 'react-hotkeys-hook';
import { SearchModal } from './components/SearchModal';
import { PromptForm } from './components/PromptForm';
import { PromptList } from './components/PromptList';
import { supabase } from './lib/supabase';
import { Search } from 'lucide-react';

// 定义提示词类型
interface Prompt {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  models?: string[];
  favorite: boolean;
  created_at: string;
  updated_at: string;
}

function App() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchResults, setSearchResults] = useState<Prompt[]>([]);
  const [connectionError, setConnectionError] = useState(false);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const promptListRef = useRef<{ refresh: () => Promise<void> }>(null);
  const toast = useToast();

  useEffect(() => {
    // 测试Supabase连接
    const testConnection = async () => {
      try {
        const { error } = await supabase.from('prompts').select('count');
        if (error) throw error;
      } catch (error) {
        console.error('Error connecting to Supabase:', error);
        setConnectionError(true);
      }
    };
    testConnection();
  }, []);

  // 使用原生事件监听器捕获 Command+K 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查是否是 Command+K (Mac) 或 Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);

  // 左右方向键切换标签页
  useHotkeys('left', () => {
    setSelectedTabIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, { enableOnFormTags: false, enabled: !isOpen });

  useHotkeys('right', () => {
    setSelectedTabIndex((prev) => (prev < 1 ? prev + 1 : prev));
  }, { enableOnFormTags: false, enabled: !isOpen });

  const handleSearch = async (query: string) => {
    try {
      if (!query.trim()) {
        // 如果搜索为空，返回最近10条记录
        const { data, error } = await supabase
          .from('prompts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setSearchResults(data || []);
        return;
      }

      // 检查是否是标签搜索
      if (query.startsWith('tag:')) {
        const tagQuery = query.substring(4).trim();
        const { data, error } = await supabase
          .from('prompts')
          .select('*')
          .contains('tags', [tagQuery]);
          
        if (error) throw error;
        setSearchResults(data || []);
        return;
      }
      
      // 同时搜索标题和内容
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching prompts:', error);
      toast({
        title: '搜索失败',
        description: '无法搜索提示词，请稍后重试',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // 处理复制提示词
  const handleCopyPrompt = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: '已复制到剪贴板',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
    onClose(); // 复制后关闭搜索框
  };

  return (
    <ChakraProvider>
      <Container maxW="container.xl" py={8}>
        {connectionError && (
          <Box p={4} mb={4} bg="red.100" color="red.800" borderRadius="md">
            <Text>无法连接到Supabase。请检查你的环境变量配置。</Text>
          </Box>
        )}
        
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl" color="green.500" textAlign="center">
            AI提示词管理工具
          </Heading>
          
          <Tabs 
            colorScheme="green" 
            variant="enclosed" 
            index={selectedTabIndex} 
            onChange={setSelectedTabIndex}
          >
            <TabList>
              <Tab>提示词列表 (←)</Tab>
              <Tab>创建提示词 (→)</Tab>
              <Box flex="1" />
              <Button 
                leftIcon={<Search size={16} />} 
                colorScheme="green" 
                variant="outline" 
                onClick={onOpen}
                size="sm"
                mt="1"
                mr="2"
              >
                搜索
              </Button>
            </TabList>
            <TabPanels>
              <TabPanel>
                <PromptList ref={promptListRef} searchModalOpen={isOpen} />
              </TabPanel>
              <TabPanel>
                <PromptForm onSuccess={() => {
                  promptListRef.current?.refresh();
                  setSelectedTabIndex(0); // 创建成功后切换到列表页
                }} />
              </TabPanel>
            </TabPanels>
          </Tabs>

          <Box textAlign="center" fontSize="sm" color="gray.500">
            <Text>快捷键: 搜索 Command+K 或点击搜索按钮 | ←/→ 切换标签页</Text>
          </Box>

          <SearchModal
            isOpen={isOpen}
            onClose={onClose}
            searchResults={searchResults}
            onSearch={handleSearch}
            onCopyPrompt={handleCopyPrompt}
          />
        </VStack>
      </Container>
    </ChakraProvider>
  );
}

export default App;