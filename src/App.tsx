import React from 'react';
import { Route, Switch } from 'wouter';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Details } from './pages/Details';
import { Watch } from './pages/Watch';
import { Library } from './pages/Library';

export default function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/search" component={Search} />
        <Route path="/details/:id" component={Details} />
        <Route path="/watch/:id" component={Watch} />
        <Route path="/library" component={Library} />
        <Route>
          <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
            404 - Not Found
          </div>
        </Route>
      </Switch>
    </Layout>
  );
}
