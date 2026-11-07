import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Briefcase, Wrench } from 'lucide-react';
import { createPageUrl } from '@/utils';
import MobileMenuContent from '@/components/mobile/MobileMenuContent';

export default function MobileNavMenu({ projects, currentProject, projectId, tools }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState('projects');
  const showSection = (value) => { setSection(value); setOpen(true); };
  const go = (page) => { setOpen(false); window.location.href = createPageUrl(page); };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => showSection('projects')} className="min-h-11 text-ios-foreground" aria-label={currentProject ? `Projects, current project ${currentProject.projectName}` : 'Projects'}>
        <Briefcase className="mr-2 h-4 w-4" aria-hidden="true" />Projects
      </Button>
      {projectId && (
        <Button variant="ghost" size="sm" onClick={() => showSection('tools')} className="min-h-11 text-ios-foreground" aria-label="Tools">
          <Wrench className="h-4 w-4" aria-hidden="true" /><span className="ml-2 hidden sm:inline">Tools</span>
        </Button>
      )}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="ios-nav-sheet" aria-describedby={undefined}>
          <DrawerHeader className="flex shrink-0 flex-row items-center justify-between px-5 pb-4 pt-3">
            <DrawerTitle className="text-[22px] font-bold tracking-tight">{section === 'projects' ? 'Projects' : 'Tools'}</DrawerTitle>
            <DrawerClose asChild>
              <button type="button" className="min-h-11 min-w-11 rounded-lg text-[17px] font-semibold text-ios-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ios-tint">Done</button>
            </DrawerClose>
          </DrawerHeader>
          <div className="ios-sheet-content">
            <MobileMenuContent
              section={section} projects={projects} projectId={projectId} tools={tools}
              onProject={(id) => go(`Home?id=${id}`)}
              onNew={() => go('NewProject')}
              onTool={(page) => go(`${page}?id=${projectId}`)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}