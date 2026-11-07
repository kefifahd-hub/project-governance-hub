import { Wrench } from 'lucide-react';
import ProjectsMobileList from '@/components/ProjectsMobileList';
import MobileToolGroups from '@/components/mobile/MobileToolGroups';
import { toolCategories } from '@/components/dashboard/toolCatalog';

export default function MobileMenuContent({ section, projects, projectId, tools = [], onProject, onNew, onTool }) {
  if (section === 'projects') {
    return <ProjectsMobileList projects={projects} currentProjectId={projectId} showDetails={false} onOpen={onProject} onNew={onNew} />;
  }
  const available = new Map(tools.map((tool) => [tool.page, tool]));
  const catalogPages = new Set(toolCategories.flatMap((category) => category.tools.map((tool) => tool.page)));
  const categories = toolCategories.map((category) => ({
    label: category.label,
    tools: category.tools.filter((tool) => available.has(tool.page)).map((tool) => ({ ...tool, ...available.get(tool.page) })),
  })).filter((category) => category.tools.length > 0);
  const otherTools = tools.filter((tool) => !catalogPages.has(tool.page)).map((tool) => ({ ...tool, icon: Wrench, color: 'bg-ios-tint' }));
  if (otherTools.length) categories.push({ label: 'More Tools', tools: otherTools });
  return categories.length ? <MobileToolGroups categories={categories} onOpen={onTool} /> : <p className="ios-navigation px-4 py-5 text-ios-muted">No tools available</p>;
}