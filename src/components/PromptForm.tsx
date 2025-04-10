import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  HStack,
  Tag,
  TagCloseButton,
  TagLabel,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Text,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import { Prompt } from '../types';

interface PromptFormProps {
  onSuccess?: () => void;
}

export const PromptForm: React.FC<PromptFormProps> = ({ onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [modelInput, setModelInput] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const toast = useToast();

  // 检查Supabase URL和密钥是否已设置
  const isSupabaseConfigured = Boolean(
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  const handleTagInput = (e: React.KeyboardEvent) => {
    if (e.key === ',' && tagInput.trim()) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    } else if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault(); // 防止表单提交
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleModelInput = (e: React.KeyboardEvent) => {
    if (e.key === ',' && modelInput.trim()) {
      setModels([...models, modelInput.trim()]);
      setModelInput('');
    } else if (e.key === 'Enter' && modelInput.trim()) {
      e.preventDefault(); // 防止表单提交
      setModels([...models, modelInput.trim()]);
      setModelInput('');
    }
  };

  const addTag = () => {
    if (tagInput.trim()) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const addModel = () => {
    if (modelInput.trim()) {
      setModels([...models, modelInput.trim()]);
      setModelInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    if (!isSupabaseConfigured) {
      setSubmitError('Supabase 未配置。请检查您的环境变量设置。');
      setIsSubmitting(false);
      return;
    }

    try {
      // 准备数据，确保数组不为空
      const tagsValue = tags.length > 0 ? tags : null;
      const modelsValue = models.length > 0 ? models : null;
      
      console.log('提交数据:', { title, content, tags: tagsValue, models: modelsValue });
      
      const { error } = await supabase.from('prompts').insert([
        {
          title,
          content,
          tags: tagsValue,
          models: modelsValue,
          favorite: false,
        },
      ]);

      if (error) throw error;

      toast({
        title: '提示词已创建',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });

      // 重置表单
      setTitle('');
      setContent('');
      setTags([]);
      setModels([]);
      setTagInput('');
      setModelInput('');

      // 调用成功回调
      onSuccess?.();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      toast({
        title: '创建失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        {!isSupabaseConfigured && (
          <Alert status="warning">
            <AlertIcon />
            <AlertTitle>未配置数据库</AlertTitle>
            <AlertDescription>
              请在 .env 文件中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY
            </AlertDescription>
          </Alert>
        )}
        
        {submitError && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>提交错误</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <FormControl isRequired>
          <FormLabel>标题</FormLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入提示标题"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>内容</FormLabel>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="输入提示内容"
            minH="200px"
          />
        </FormControl>

        <FormControl>
          <FormLabel>标签</FormLabel>
          <HStack>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInput}
              placeholder="输入标签后按回车或逗号添加"
              flex="1"
            />
            <Button size="md" onClick={addTag} colorScheme="green">
              添加
            </Button>
          </HStack>
          <Text fontSize="xs" color="gray.500" mt={1}>
            提示：输入标签后按回车、逗号或点击添加按钮
          </Text>
          <HStack mt={2} wrap="wrap">
            {tags.map((tag) => (
              <Tag
                key={tag}
                size="md"
                borderRadius="full"
                variant="solid"
                colorScheme="green"
              >
                <TagLabel>{tag}</TagLabel>
                <TagCloseButton
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                />
              </Tag>
            ))}
          </HStack>
        </FormControl>

        <FormControl>
          <FormLabel>推荐模型</FormLabel>
          <HStack>
            <Input
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              onKeyDown={handleModelInput}
              placeholder="输入模型后按回车或逗号添加"
              flex="1"
            />
            <Button size="md" onClick={addModel} colorScheme="blue">
              添加
            </Button>
          </HStack>
          <Text fontSize="xs" color="gray.500" mt={1}>
            提示：输入模型后按回车、逗号或点击添加按钮
          </Text>
          <HStack mt={2} wrap="wrap">
            {models.map((model) => (
              <Tag
                key={model}
                size="md"
                borderRadius="full"
                variant="solid"
                colorScheme="blue"
              >
                <TagLabel>{model}</TagLabel>
                <TagCloseButton
                  onClick={() => setModels(models.filter((m) => m !== model))}
                />
              </Tag>
            ))}
          </HStack>
        </FormControl>

        <Button 
          type="submit" 
          colorScheme="green"
          isLoading={isSubmitting}
          loadingText="提交中..."
        >
          保存提示
        </Button>
      </VStack>
    </Box>
  );
};