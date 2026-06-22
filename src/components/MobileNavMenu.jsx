import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Briefcase, Wrench, Plus, X } from 'lucide-react';
import { createPageUrl } from '../utils';

/**
 * Mobile bottom-sheet navigation for Projects and Tools.
 * Replaces the desktop DropdownMenu components on small screens.
 */
export default function MobileNavMenu({ projects, currentProject, projectId, tools }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState('projects');

  const handleProjectClick = (id) => {
    window.location.href = createPageUrl(`Home?id=${id}`);
    setOpen(false);
  };

  const handleToolClick = (page) => {
    window.location.href = createPageUrl(`${page}?id=${projectId}`);
    setOpen(false);
  };

  const handleNewProject = () => {
    window.location.href = createPageUrl('NewProject');
    setOpen(false);
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => { setSection('projects'); setOpen(true); }} style={{ color: '#CADCFC' }}>
        <Briefcase className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">{currentProject?.projectName || 'Projects'}</span>
        <span className="sm:hidden">Projects</span>
      </Button>
      {projectId && (
        <Button variant="ghost" size="sm" onClick={() => { setSection('tools'); setOpen(true); }} style={{ color: '#CADCFC' }}>
          <Wrench className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Tools</span>
        </Button>
      )}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent style={{ background: 'rgba(15, 23, 42, 0.98)', maxHeight: '80vh' }}>
          <DrawerHeader className="flex flex-row items-center justify-between">
            <DrawerTitle style={{ color: '#CADCFC' }}>
              {section === 'projects' ? 'Projects' : 'Tools'}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" style={{ color: '#94A3B8' }}>
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6 max-h-[60vh]">
            {section === 'projects' && (
              <div className="space-y-1">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectClick(project.id)}
                    className="w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 transition-all"
                    style={{
                      color: projectId === project.id ? '#00A896' : '#CADCFC',
                      background: projectId === project.id ? 'rgba(0,168,150,0.1)' : 'rgba(30,39,97,0.3)',
                      minHeight: '44px',
                    }}
                  >
                    <Briefcase className="w-4 h-4 shrink-0" />
                    <span className="truncate">{project.projectName}</span>
                  </button>
                ))}
                <button
                  onClick={handleNewProject}
                  className="w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 transition-all"
                  style={{ color: '#00A896', background: 'rgba(0,168,150,0.1)', minHeight: '44px' }}
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  New Project
                </button>
              </div>
            )}
            {section === 'tools' && (
              <div className="space-y-1">
                {tools.map((tool) => (
                  <button
                    key={tool.page}
                    onClick={() => handleToolClick(tool.page)}
                    className="w-full text-left px-4 py-3 rounded-lg flex items-center transition-all"
                    style={{ color: '#CADCFC', background: 'rgba(30,39,97,0.3)', minHeight: '44px' }}
                  >
                    {tool.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}